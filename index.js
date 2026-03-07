const express = require('express');
const app = express();
const port = 3000;

const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employee');

// static files
app.use(express.static('public'));

// template engine
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// form
app.use(express.urlencoded({ extended: true }));

// session
app.use(session({
    secret: 'hr-system-secret',
    resave: false,
    saveUninitialized: false
}));

// ป้องกัน browser cache
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// global variables
app.use((req, res, next) => {
    res.locals.activePage = '';
    res.locals.user = req.session.user || null;
    next();
});

// middleware
const { isLoggedIn } = require('./middleware/authMiddleware');

// home
app.get('/', isLoggedIn, (req, res) => {
    res.render('home');
});

// routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', employeeRoutes);

// start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});