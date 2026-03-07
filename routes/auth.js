const express = require('express');
const router = express.Router();
const conn = require('../database');

router.get('/login', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../public/login.html'));
});

router.post('/signin', (req, res) => {

    const { userinput, password } = req.body;

    const sql = `
    SELECT users.*, employees.first_name, employees.last_name
    FROM users
    JOIN employees ON users.employee_id = employees.employee_id
    WHERE employees.employee_code = ?
    `;

    conn.query(sql, [userinput], (err, results) => {

        if (results.length === 0) {
            return res.send("ไม่พบบัญชีผู้ใช้");
        }

        const user = results[0];

        if (user.password !== password) {
            return res.send("รหัสผ่านไม่ถูกต้อง");
        }

        if (user.must_change_password == 1) {
            return res.render('auth/change-password', {
                user_id: user.user_id
            });
        }

        res.render('profile', { user });
    });

});

module.exports = router;