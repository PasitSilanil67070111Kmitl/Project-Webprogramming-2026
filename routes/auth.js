const express = require('express');
const router = express.Router();
const conn = require('../database');

// หน้า login
router.get('/login', (req, res) => {
    res.render('login');
});

// login
router.post('/login', (req, res) => {

    const { employee_code, password } = req.body;

    const sql = `
    SELECT users.user_id, roles.role_name, employees.first_name
    FROM users
    JOIN employees ON users.employee_id = employees.employee_id
    JOIN roles ON users.role_id = roles.role_id
    WHERE employees.employee_code = ? AND users.password = ?
    `;

    conn.query(sql, [employee_code, password], (err, result) => {

        if (err) {
            console.error(err);
            return res.send("Database Error");
        }

        if (!result || result.length === 0) {
            return res.send("Login Failed");
        }

        const user = result[0];

        // สร้าง session
        req.session.user = {
            id: user.user_id,
            name: user.first_name,
            role: user.role_name
        };

        // redirect
        res.redirect('/admin/users');

    });

});

// logout
router.get('/logout', (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.send("Logout Error");
        }

        res.redirect('/login');

    });

});

module.exports = router;