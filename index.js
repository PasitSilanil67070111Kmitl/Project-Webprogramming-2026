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
    SELECT users.*, employees.first_name, employees.last_name
    FROM users
    JOIN employees ON users.employee_id = employees.employee_id
    WHERE employees.employee_code = ?
`;

    conn.query(sql, [userinput], (err, results) => {

        if (err) throw err;

        if (results.length === 0) {
            return res.send("ไม่พบบัญชีผู้ใช้");
        }

        const user = results[0];

        if (user.password !== password) {
            return res.send("รหัสผ่านไม่ถูกต้อง");
        }

        // 🔥 ถ้าต้องเปลี่ยนรหัส
        if (user.must_change_password == 1) {

            return res.render('auth/change-password', {
                user_id: user.user_id
            });



        }

        res.render('profile', { user: user });

    });
});

app.get('/add-employee', (req, res) => {
    res.render('employee/add_employee');
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

    // 1️⃣ insert ก่อน (ยังไม่ใส่ employee_code)
    const insertSql = `
        INSERT INTO employees 
        (first_name, last_name, date_of_birth, gender, phone, email, address, hire_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    conn.query(insertSql,
        [first_name, last_name, date_of_birth, gender, phone, email, address, hire_date],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.send("Error adding employee");
            }

            // 2️⃣ ใช้ insertId มา generate code
            const newId = result.insertId;

            const employeeCode = "EMP" + newId.toString().padStart(4, "0");
            // EMP0001, EMP0002 ...

            // 3️⃣ update กลับเข้าไป
            const updateSql = `
                UPDATE employees
                SET employee_code = ?
                WHERE employee_id = ?
            `;

            conn.query(updateSql, [employeeCode, newId], (err) => {

                if (err) {
                    console.log(err);
                    return res.send("Error generating employee code");
                }

                res.send("Employee added successfully with code: " + employeeCode);
            });

        }
    );
});

app.get('/admin/users', (req, res) => {

    const sqlUsers = `
        SELECT 
    users.user_id,
    employees.employee_id,
    employees.employee_code,
    users.role_id,
    employees.first_name,
    employees.last_name,
    employees.email,
    roles.role_name
FROM users
JOIN employees ON users.employee_id = employees.employee_id
JOIN roles ON users.role_id = roles.role_id

    `;

    conn.query(sqlUsers, (err, users) => {

        if (err) {
            console.log(err);
            return res.send("Error loading users");
        }

        conn.query(`
    SELECT * FROM employees
    WHERE employee_id NOT IN (
        SELECT employee_id FROM users
    )
`, (err, employees) => {


            conn.query("SELECT * FROM roles", (err, roles) => {

                res.render('admin/admin_users', {
                    users: users,
                    employees: employees,
                    roles: roles
                });

            });

        });

    });

});

// อัปเดต role
app.post('/admin/update-role', (req, res) => {

    const { user_id, role_id } = req.body;

    const sql = `
        UPDATE users
        SET role_id = ?
        WHERE user_id = ?
    `;

    conn.query(sql, [role_id, user_id], (err) => {

        if (err) {
            console.log(err);
            return res.send("Error updating role");
        }

        res.redirect('/admin/users');
    });

});


app.post('/admin/create-user', (req, res) => {

    const { employee_id, password, role_id } = req.body;

    const sql = `
INSERT INTO users (employee_id, role_id, password)
VALUES (?, ?, ?)
`;

    conn.query(sql, [employee_id, role_id, password], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error creating user");
        }

        res.redirect('/admin/users');
    });


});

app.post('/change-password', (req, res) => {

    const { user_id, new_password } = req.body;

    const sql = `
        UPDATE users
        SET password = ?, must_change_password = 0
        WHERE user_id = ?
    `;

    conn.query(sql, [new_password, user_id], (err) => {

        if (err) {
            console.log(err);
            return res.send("Error changing password");
        }

        res.redirect('/login'); // กลับไปหน้า login
    });

});





app.listen(port, () => {
    console.log(`listening to port ${port}`);
}); 