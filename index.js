const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const conn = require('./database');

// static resource
app.use(express.static('public'));

// template engine
app.set('view engine', 'ejs');


app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home');
});


// routing 

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html'));
});

app.post('/signin', (req, res) => {

    const { userinput, password } = req.body;

    const sql = `
        SELECT users.*, employees.email
FROM users
JOIN employees ON users.employee_id = employees.employee_id
WHERE employees.email = ? OR employees.first_name = ?

    `;

    conn.query(sql, [userinput, userinput], (err, results) => {

        if (err) throw err;

        //ไม่พบบัญชี
        if (results.length === 0) {
            return res.send("ไม่พบบัญชีผู้ใช้");
        }

        const user = results[0];

        //password ไม่ตรง
        if (user.password !== password) {
            return res.send("รหัสผ่านไม่ถูกต้อง");
        }

        //login สำเร็จ
        res.render('profile', { user: user });

    });

});

app.get('/add-employee', (req, res) => {
    res.render('add_employee');
});

// รับค่าจาก form
app.post('/add-employee', (req, res) => {
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

    const sql = `
        INSERT INTO employees 
        (first_name, last_name, date_of_birth, gender, phone, email, address, hire_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    conn.query(sql,
        [first_name, last_name, date_of_birth, gender, phone, email, address, hire_date],
        (err, result) => {
            if (err) throw err;
            res.send("Employee added successfully!");
        }
    );
});
app.get('/admin/users', (req, res) => {

    const sql = `
        SELECT 
            users.user_id,
            users.role,
            employees.first_name,
            employees.last_name,
            employees.email
        FROM users
        LEFT JOIN employees 
        ON users.employee_id = employees.employee_id
    `;

    conn.query(sql, (err, users) => {
        if (err) throw err;
        res.render('admin_users', { users });
    });
});

// อัปเดต role
app.post('/admin/update-role', (req, res) => {
    const { user_id, role } = req.body;

    const sql = "UPDATE users SET role = ? WHERE user_id = ?";

    conn.query(sql, [role, user_id], (err) => {
        if (err) throw err;
        res.redirect('/admin/users');
    });
});

app.listen(port, () => {
    console.log(`listening to port ${port}`);
}); 