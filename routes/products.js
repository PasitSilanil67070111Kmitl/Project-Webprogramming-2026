const express = require('express');
const router = express.Router();
const conn = require('../database');

router.get('/home', (req, res) => {
    // ดึง Logs ล่าสุด 5 รายการ
    const sqlLogs = `SELECT * FROM product_logs ORDER BY created_at DESC LIMIT 5`;

    conn.query(sqlLogs, (err, logResults) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database Error");
        }

        res.render('./staff/staff_home', { 
            latestLogs: logResults,
            layout: 'layouts/staff_main', 
            activePage: 'home' 
        });
    });
});

router.get('/inventory', (req, res) => {
    const search = req.query.search || ''; 
    const itemsPerPage = 12; 
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    // 1. นับจำนวนสินค้าที่ตรงตามเงื่อนไข (ต้องมีสต็อก และ ตรงกับคำค้นหา)
    let countSql = `SELECT COUNT(*) as total FROM products WHERE stock_quantity > 0`;
    const countParams = [];

    if (search !== '') {
        countSql += ` AND (product_name LIKE ? OR sku LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
    }

    conn.query(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).send("Error counting products");

        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        // 2. ดึงข้อมูลสินค้าแบบ Join พร้อมคำสั่ง LIMIT สำหรับ Pagination
        let sql = `
            SELECT p.*, c.category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity > 0
        `;

        const params = [];
        if (search !== '') {
            sql += ` AND (p.product_name LIKE ? OR p.sku LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ` ORDER BY p.id ASC LIMIT ? OFFSET ?`;
        params.push(itemsPerPage, offset);

        conn.query(sql, params, (err, productResult) => {
            if (err) return res.status(500).send("Database Error");

            const sqlCat = "SELECT * FROM categories";
            conn.query(sqlCat, (err, catResult) => {
                if (err) return res.status(500).send(err);

                res.render('./staff/inventory', { 
                    allProducts: productResult,
                    allCategories: catResult, 
                    searchQuery: search, // ส่งคำค้นหากลับไปที่ Input
                    currentPage: currentPage,
                    totalPages: totalPages,
                    layout: 'layouts/staff_main', 
                    activePage: 'inventory'
                });
            });
        });
    });
});

router.post('/add-product', (req, res) => {
    // 1. ดึงข้อมูลจากฟอร์ม
    const { product_name, sku, category_id, description, stock_quantity, price } = req.body;

    // เตรียม SQL สำหรับเพิ่มสินค้าหลัก
    const sql = `INSERT INTO products (product_name, sku, category_id, description, stock_quantity, price) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    // 2. รันคำสั่ง Insert สินค้า
    conn.query(sql, [product_name, sku, category_id, description, stock_quantity, price], (err, result) => {
        if (err) {
            console.error("Error inserting product:", err);
            return res.status(500).send("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }

        const addPrice = parseFloat(price)

        console.log("เพิ่มสินค้าสำเร็จ ID:", result.insertId);

        // --- เริ่มต้นการบันทึก LOG ---
        // 3. เตรียมข้อมูลสำหรับตาราง inventory_logs 
        // คอลัมน์: sku, product_name, action, changed_by, created_at, stock_quantity, detail
        const logSql = `
            INSERT INTO product_logs (sku, product_name, action, changed_by, stock_quantity, price, detail, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const logValues = [
            sku, 
            product_name, 
            'เพิ่มสินค้า',               // action
            'Staff',              // changed_by (ปรับตามระบบ login ของคุณ)
            stock_quantity,
            addPrice,
            'เพิ่มสินค้าใหม่เข้าระบบ'    // detail
        ];

        // 4. รันคำสั่ง Insert Log
        conn.query(logSql, logValues, (logErr) => {
            if (logErr) {
                // ถ้า log พัง แต่อยากให้หน้าเว็บไปต่อได้ ก็สั่ง redirect เลย
                console.error("Error inserting log:", logErr);
            }
            
            // 5. เมื่อสำเร็จทั้งหมด ให้กลับไปที่หน้าแสดงรายการสินค้า
            res.redirect('/inventory'); 
        });
    });
});

router.post('/update-product', (req, res) => {
    const { sku, name, action, quantity_change, price, detail } = req.body;
    
    const qtyChange = parseInt(quantity_change) || 0;
    const inputPrice = parseFloat(price); // รับค่ามาก่อน (ยังไม่ใส่ || 0)

    let stockLogic = "stock_quantity";
    let actionText = "ปรับปรุงข้อมูล";
    let updateFields = "price = ?"; // SQL ส่วนที่จะ Update
    let updateValues = [];

    // 2. แยก Logic ตามประเภท Action
    if (action === 'add_stock') {
        stockLogic = `stock_quantity + ${qtyChange}`;
        actionText = "เพิ่มสต็อกสินค้า";
        // กรณีเพิ่มสต็อกอย่างเดียว: ไม่ต้องแก้ราคา (ดึงราคาเดิมจาก DB มาใช้ใน LOG)
        updateFields = "stock_quantity = " + stockLogic; 
    } else if (action === 'withdraw') {
        stockLogic = `stock_quantity - ${qtyChange}`;
        actionText = "เบิกสินค้า";
        updateFields = "stock_quantity = " + stockLogic;
    } else if (action === 'update_info') {
        // กรณีแก้ไขข้อมูล: ให้ Update ทั้งสต็อก (ถ้ากรอก) และราคา
        stockLogic = `stock_quantity + ${qtyChange}`;
        updateFields = `stock_quantity = ${stockLogic}, price = ?`;
        updateValues.push(inputPrice || 0); // ใส่ราคาใหม่
    }

    // 3. อัปเดตตาราง products
    // ใช้ SQL แบบไดนามิกตามประเภท action
    const sqlUpdate = `UPDATE products SET ${updateFields} WHERE sku = ?`;
    updateValues.push(sku);

    conn.query(sqlUpdate, updateValues, (err) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).send("ไม่สามารถอัปเดตสินค้าได้");
        }

        // 4. บันทึกลงตาราง product_logs
        // หมายเหตุ: ตรงนี้เราต้องหาว่าราคาล่าสุดคือเท่าไหร่เพื่อลง Log ให้ถูกต้อง
        // ดึงราคาปัจจุบันมาลง Log เผื่อกรณีที่เราไม่ได้ Update ราคาในครั้งนี้
        const sqlGetPrice = "SELECT price FROM products WHERE sku = ?";
        conn.query(sqlGetPrice, [sku], (err, priceResult) => {
            const currentPrice = priceResult[0] ? priceResult[0].price : 0;

            const logSql = `
                INSERT INTO product_logs (sku, product_name, action, changed_by, stock_quantity, price, detail, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const logValues = [sku, name, actionText, 'Staff', qtyChange, currentPrice, detail];

            conn.query(logSql, logValues, (logErr) => {
                if (logErr) console.error("Log Error:", logErr);
                res.redirect('/inventory');
            });
        });
    });
});

router.post('/remove-product', (req, res) => {
    const { id, sku, name } = req.body;
    
    // ลบสินค้า
    const sqlDelete = "DELETE FROM products WHERE id = ?";
    conn.query(sqlDelete, [id], (err) => {
        if (err) return res.status(500).send("Delete Error");

        // บันทึก Log การลบ (ตามโครงสร้าง image_066334.png)
        const sqlLog = `INSERT INTO product_logs (sku, product_name, action, changed_by, stock_quantity, detail) 
                        VALUES (?, ?, ?, ?, ?, ?)`;
        
        conn.query(sqlLog, [sku, name, 'ลบสินค้า', 'Staff', 0, 'ลบข้อมูลออกจากคลัง'], (logErr) => {
            res.redirect('/inventory');
        });
    });
});

router.get('/inventory-logs', (req, res) => {
    const search = req.query.search || ''; 
    const itemsPerPage = 12; 
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    // 1. นับจำนวน Log ทั้งหมดที่ตรงตามเงื่อนไขการค้นหา
    let countSql = `SELECT COUNT(*) as total FROM product_logs`;
    const countParams = [];

    if (search !== '') {
        // ค้นหาจาก SKU, ชื่อสินค้า หรือ ประเภทการกระทำ (Action)
        countSql += ` WHERE sku LIKE ? OR product_name LIKE ? OR action LIKE ?`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    conn.query(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).send("Error counting logs");

        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        // 2. ดึงข้อมูล Log ตามหน้า และเงื่อนไขการค้นหา
        let sql = `SELECT * FROM product_logs`;
        const params = [];

        if (search !== '') {
            sql += ` WHERE sku LIKE ? OR product_name LIKE ? OR action LIKE ?`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(itemsPerPage, offset);

        conn.query(sql, params, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("เกิดข้อผิดพลาดในการดึง Log");
            }
            
            res.render('./staff/inventory-logs', { 
                logs: results, 
                currentPage: currentPage, 
                totalPages: totalPages,
                searchQuery: search, // ส่งค่าค้นหากลับไปที่ช่อง Input
                layout: 'layouts/staff_main', 
                activePage: 'inventory-logs'
            });
        });
    });
});

module.exports = router;