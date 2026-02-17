const mysql = require('mysql2');

const conn = mysql.createConnection({
    host: "webdev.it.kmitl.ac.th",
    user: "s67070111",
    password: "BPS63GUK55F",
    database: "s67070111",
    port: "3306"
});

conn.connect(err => {
    if (err) throw err;
    console.log("Connected to database");
});

module.exports = conn;
