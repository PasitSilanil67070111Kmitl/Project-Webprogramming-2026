// index.js

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;


// เพิ่มใช้งานไฟล์
const conn = require('./database'); 

// static resourse & template engine


// routing 



app.listen(port, () => {
    console.log(`listening to port ${port}`);
}); 