const express = require('express');
const router = express.Router();
const conn = require('../database');

// =============================
// แสดงหน้า users
// =============================
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

        if (err) {
            console.error(err);
            return res.send("Error loading users");
        }

        conn.query(`
        SELECT * FROM employees
        WHERE employee_id NOT IN (SELECT employee_id FROM users)
        `, (err, employees) => {

            if (err) {
                console.error(err);
                return res.send("Error loading employees");
            }

            conn.query("SELECT * FROM roles", (err, roles) => {

                if (err) {
                    console.error(err);
                    return res.send("Error loading roles");
                }

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


// =============================
// อัปเดต role
// =============================
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


// =============================
// สร้าง user
// =============================
router.post('/create-user', (req, res) => {

    const { employee_id, password, role_id } = req.body;

    const sql = `
    INSERT INTO users (employee_id, role_id, password)
    VALUES (?, ?, ?)
    `;

    conn.query(sql, [employee_id, role_id, password], (err) => {

        if (err) {
            console.error(err);
            return res.send("Error creating user");
        }

        res.redirect('/admin/users');
    });

});


// =============================
// ลบ user
// =============================
router.post('/delete-user', (req, res) => {

    const { user_id } = req.body;

    const sql = "DELETE FROM users WHERE user_id = ?";

    conn.query(sql, [user_id], (err) => {

        if (err) {
            console.error(err);
            return res.send("Error deleting user");
        }

        res.redirect('/admin/users');
    });

});

module.exports = router;