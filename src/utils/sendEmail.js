const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER, // your Gmail
      pass: process.env.SMTP_PASS, // app password
    },
  });

  await transporter.sendMail({
    from: `"DevTinder" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
