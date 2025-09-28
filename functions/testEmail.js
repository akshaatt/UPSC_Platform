// functions/testEmail.js
const nodemailer = require("nodemailer");

async function main() {
  try {
    // ✅ Use direct Gmail SMTP config
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for 587
      auth: {
        user: "satyapathupsc@gmail.com", // your Gmail address
        pass: "bycpabanmiimebek", // paste App Password here
      },
    });

    const info = await transporter.sendMail({
      from: '"Satyapath" <satyapathupsc@gmail.com>', // sender name + email
      to: "akshatgarg017@gmail.com", // change to your test email
      subject: "✅ SMTP Test from Satyapath",
      text: "Hello! This is a test email sent using Gmail SMTP + Nodemailer.",
      html: "<b>Hello!</b><br/>This is a <i>test email</i> sent using Gmail SMTP + Nodemailer.",
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
}

main();
