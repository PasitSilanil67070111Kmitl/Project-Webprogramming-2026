const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "yourgmail@gmail.com",
        pass: "your_app_password"
    }
});

function sendPasswordEmail(toEmail, employeeCode, password) {

    const mailOptions = {
        from: "yourgmail@gmail.com",
        to: toEmail,
        subject: "บัญชีเข้าใช้งานระบบคลังสินค้า (WMS)",
        html: `
        <h2>บัญชีเข้าใช้งานระบบ</h2>
        <p>รหัสพนักงาน: <b>${employeeCode}</b></p>
        <p>รหัสผ่าน: <b>${password}</b></p>
        <p>กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบ</p>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = sendPasswordEmail;