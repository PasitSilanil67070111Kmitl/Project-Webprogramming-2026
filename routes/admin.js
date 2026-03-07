const express = require('express');
const router = express.Router();
const conn = require('../database');

const { isAdmin } = require('../middleware/authMiddleware');

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

        console.log("Generated password:", password);

        res.send(`
            <h2>User Created</h2>
            <p>Password: <b>${password}</b></p>
            <a href="/admin/users">Back</a>
        `);

    });

});
module.exports = router;