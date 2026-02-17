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
        SELECT * FROM users 
        WHERE name = ? OR email = ?
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


app.listen(port, () => {
    console.log(`listening to port ${port}`);
}); 