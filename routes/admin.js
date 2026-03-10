const express = require('express');
const router = express.Router();
const conn = require('../database');
const sendPasswordEmail = require('../utils/sendEmail');
const { isAdmin } = require('../middleware/authMiddleware');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "pasit.nicework@gmail.com",
        pass: "ojgr oaub nbqd yxpo"
    }
});
router.use(isAdmin);

router.get('/users', (req, res) => {

    const sql = `
    SELECT users.user_id, employees.employee_id,
    employees.employee_code, users.role_id,
    employees.first_name, employees.last_name,
    employees.email, roles.role_name
    FROM users
    JOIN employees ON users.employee_id = employees.employee_id
    JOIN roles ON users.role_id = roles.role_id
    `;

    conn.query(sql, (err, users) => {

        conn.query(`
        SELECT * FROM employees
        WHERE employee_id NOT IN (SELECT employee_id FROM users)
        `, (err, employees) => {

            conn.query("SELECT * FROM roles", (err, roles) => {

                res.render('admin/admin_users', {
                    users,
                    employees,
                    roles,
                    activePage: 'users'
                });

            });

        });

    });

});
router.post('/create-user', (req, res) => {

    const { employee_id, role_id } = req.body;

    // สุ่ม password 6 ตัว
    const password = Math.random().toString(36).slice(-6);

    const sql = `
    INSERT INTO users (employee_id, role_id, password)
    VALUES (?, ?, ?)
    `;

    conn.query(sql, [employee_id, role_id, password], (err) => {

        if (err) {
            console.error(err);
            return res.send("Error creating user");
        }

        // ดึง email พนักงาน
        conn.query(
            "SELECT employee_code, email FROM employees WHERE employee_id = ?",
            [employee_id],
            (err, result) => {

                if (err || result.length === 0) {
                    return res.redirect('/admin/users');
                }

                const employee = result[0];

                // ส่ง email
                const mailOptions = {
                    from: "yourgmail@gmail.com",
                    to: employee.email,
                    subject: "บัญชีเข้าใช้งานระบบ WMS",
                    html: `
                        <h2>บัญชีเข้าใช้งานระบบคลังสินค้า</h2>
                        <p>รหัสพนักงาน: <b>${employee.employee_code}</b></p>
                        <p>รหัสผ่าน: <b>${password}</b></p>
                        <p>กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบ</p>
                    `
                };

                transporter.sendMail(mailOptions, (error, info) => {

                    if (error) {
                        console.error("Email error:", error);
                    } else {
                        console.log("Email sent:", info.response);
                    }

                    res.send(`
                        <script>
                            alert("สร้างบัญชีสำเร็จ และส่งรหัสไปที่ Email แล้ว");
                            window.location.href = "/admin/users";
                        </script>
                    `);

                });

            }
        );

    });

});

router.post('/update-role', (req, res) => {

    const { user_id, role_id } = req.body;

    const sql = `
    UPDATE users
    SET role_id = ?
    WHERE user_id = ?
    `;

    conn.query(sql, [role_id, user_id], (err) => {

        if (err) {
            console.error(err);
            return res.send("Error updating role");
        }

        res.redirect('/admin/users');
    });

});

router.post('/delete-user', (req, res) => {

    const { user_id } = req.body;

    const sql = `DELETE FROM users WHERE user_id = ?`;

    conn.query(sql, [user_id], (err) => {

        if (err) {
            console.error(err);
            return res.send("Error deleting user");
        }

        res.redirect('/admin/users');
    });

});
module.exports = router;