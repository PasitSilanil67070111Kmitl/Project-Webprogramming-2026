const express = require('express');
const app = express();
const port = 3000;
const expressLayouts = require('express-ejs-layouts');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employee');

// static
app.use(express.static('public'));

// template
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.use(express.urlencoded({ extended: true }));

// กัน activePage error
app.use((req, res, next) => {
    res.locals.activePage = '';
    next();
});

// ✅ หน้าแรก
app.get('/', (req, res) => {
    res.render('home');
});

// routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', employeeRoutes);

app.listen(port, () => {
    console.log(`listening to port ${port}`);
});