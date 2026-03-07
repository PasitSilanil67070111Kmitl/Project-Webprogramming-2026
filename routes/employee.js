const express = require('express');
const router = express.Router();
const conn = require('../database');

router.get('/add-employee', (req, res) => {
    res.render('employee/add_employee', {
        activePage: 'add-employee'
    });
});

router.post('/add-employee', (req, res) => {

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

            const newId = result.insertId;
            const employeeCode = "EMP" + newId.toString().padStart(4, "0");

            conn.query(
                "UPDATE employees SET employee_code=? WHERE employee_id=?",
                [employeeCode, newId]
            );

            res.redirect('/add-employee');
        });

});

module.exports = router;