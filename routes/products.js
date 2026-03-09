const express = require('express');
const router = express.Router();
const conn = require('../database');

router.get('/home', (req, res) => {
    res.render('./staff/staff_home', 
    { layout: 'layouts/staff_main', activePage: 'home'});
});

router.get('/inventory', (req, res) => {
    const search = req.query.search || ''; 

    // 1. แก้ไข: เพิ่ม p หลัง products และ c หลัง categories เพื่อทำ Alias
    let sql = `
        SELECT p.*, c.category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
    `;

    const params = [];

    // 2. ตรวจสอบเงื่อนไขการค้นหา
    if (search !== '') {
        sql += ` WHERE p.product_name LIKE ? OR p.sku LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
    }

    // 3. แก้ไข: เพิ่ม params เข้าไปในฟังก์ชัน query
    conn.query(sql, params, (err, result) => { 
        if (err) {
            console.error(err);
            return res.status(500).send("Database Error");
        }

        const sqlCat = "SELECT * FROM categories";
        conn.query(sqlCat, (err, catResult) => {
            if (err) return res.status(500).send(err);

            res.render('./staff/inventory', { 
                allProducts: result,
                allCategories: catResult, 
                searchQuery: search,
                layout: 'layouts/staff_main', 
                activePage: 'inventory'
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

        console.log("เพิ่มสินค้าสำเร็จ ID:", result.insertId);

        // --- เริ่มต้นการบันทึก LOG ---
        // 3. เตรียมข้อมูลสำหรับตาราง inventory_logs 
        // คอลัมน์: sku, product_name, action, changed_by, created_at, stock_quantity, detail
        const logSql = `INSERT INTO product_logs (sku, product_name, action, changed_by, stock_quantity, detail, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, NOW())`;
        
        const logValues = [
            sku, 
            product_name, 
            'เพิ่มสินค้า',               // action
            'Staff',              // changed_by (ปรับตามระบบ login ของคุณ)
            stock_quantity, 
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
    // 1. รับค่าจาก Modal
    const { sku, action, quantity_change, price, detail } = req.body;
    const qtyChange = parseInt(quantity_change) || 0;

    // --- ส่วนที่เพิ่มเข้ามา: ดึงชื่อสินค้าจาก Database ---
    const sqlGetName = "SELECT product_name FROM products WHERE sku = ?";
    
    conn.query(sqlGetName, [sku], (err, results) => {
        if (err || results.length === 0) {
            console.error("Fetch Name Error:", err);
            return res.status(500).send("ไม่พบข้อมูลสินค้าชิ้นนี้");
        }

        // เก็บชื่อสินค้าที่ได้จาก DB ไว้ในตัวแปร
        const productNameFromDB = results[0].product_name;

        // 2. เตรียม Logic สำหรับการอัปเดตสต็อก
        let stockLogic = "stock_quantity";
        let actionText = "ปรับปรุงข้อมูล";

        if (action === 'add_stock') {
            stockLogic = `stock_quantity + ${qtyChange}`;
            actionText = "เพิ่มสต็อกสินค้า";
        } else if (action === 'withdraw') {
            stockLogic = `stock_quantity - ${qtyChange}`;
            actionText = "เบิกสินค้า";
        }

        // 3. รันคำสั่ง UPDATE ตาราง products
        const sqlUpdate = `
            UPDATE products 
            SET stock_quantity = ${stockLogic}, 
                price = ? 
            WHERE sku = ?
        `;

        conn.query(sqlUpdate, [price, sku], (updErr, result) => {
            if (updErr) {
                console.error("Update Error:", updErr);
                return res.status(500).send("ไม่สามารถอัปเดตสินค้าได้");
            }

            // 4. บันทึกลงตาราง product_logs (ใช้ productNameFromDB ที่ดึงมาได้)
            const logSql = `
                INSERT INTO product_logs (sku, product_name, action, changed_by, stock_quantity, detail, created_at, price) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
            `;

            const logValues = [
                sku,
                productNameFromDB, // ใช้ชื่อจาก Database แทนการรับจาก Body
                `${actionText}`, 
                'Staff',                    
                qtyChange,                     
                detail,
                price                    
            ];

            conn.query(logSql, logValues, (logErr) => {
                if (logErr) {
                    console.error("Log Error:", logErr);
                }
                // 5. สำเร็จแล้วกลับไปหน้า Inventory
                res.redirect('inventory');
            });
        });
    });
});

router.get('/inventory-logs', (req, res) => {
    const sql = `SELECT * FROM product_logs ORDER BY created_at DESC`;
    
    conn.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("เกิดข้อผิดพลาดในการดึง Log");
        }
        // ส่งข้อมูลไปที่หน้า ejs
        res.render('./staff/inventory-logs', 
        { logs: results, layout: 'layouts/staff_main', activePage: 'inventory-logs'});
    });
});

module.exports = router;