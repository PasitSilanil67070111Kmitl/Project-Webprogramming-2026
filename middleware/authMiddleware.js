function isLoggedIn(req, res, next) {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    // ถ้าเป็นพนักงานให้ไปหน้า home
    if (req.session.user.role_id !== 1) {
        return res.redirect('/home');
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