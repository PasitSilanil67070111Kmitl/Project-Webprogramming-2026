function isLoggedIn(req, res, next) {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    const role = req.session.user.role_id;

    // Manager เข้าได้เฉพาะหน้า inventory-logs
    if (role === 2 && req.path !== '/inventory-logs') {
        return res.redirect('/inventory-logs');
    }

    next();
}

function isAdmin(req, res, next) {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.role_id !== 1) {
        return res.send(`
            <script>
                alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                window.location.href = "/home";
            </script>
        `);
    }

    next();
}

module.exports = { isLoggedIn, isAdmin };