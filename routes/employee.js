const express = require('express');
const router = express.Router();
const conn = require('../database');

const { isAdmin } = require('../middleware/authMiddleware');

router.get('/add-employee', isAdmin, (req, res) => {
    res.render('employee/add_employee', {
        activePage: 'add-employee'
    });
});

router.post('/add-employee', isAdmin, (req, res) => {

    const {
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        hire_date
    } = req.body;

    const insertSql = `
    INSERT INTO employees 
    (first_name, last_name, date_of_birth, gender, phone, email, address, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    conn.query(insertSql,
    [first_name, last_name, date_of_birth, gender, phone, email, address, hire_date],
    (err, result) => {

        if (err) {
            console.error(err);
            return res.send("Insert Error");
        }

        const newId = result.insertId;

        const employeeCode = "EMP" + newId.toString().padStart(4, "0");

        conn.query(
            "UPDATE employees SET employee_code=? WHERE employee_id=?",
            [employeeCode, newId],
            (err) => {

                if (err) {
                    console.error(err);
                }

                res.redirect('/add-employee');
            }
        );

});

});

module.exports = router;