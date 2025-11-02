const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: "apikey", // always use this literal string
    pass: process.env.SENDGRID_API_KEY, // your actual API key
  },
});

const sendEmail = async (to, subject, html, fromName = "Ticketing System") => {
  try {
    console.log("📧 Attempting to send email via SendGrid SMTP...");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  SENDGRID_API_KEY present:", !!process.env.SENDGRID_API_KEY);

    const mailOptions = {
      from: `"${fromName}" <aniket@aristasystems.in>`, // must match a verified domain/sender
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("  Message ID:", info.messageId || "N/A");
    console.log("  Response:", info.response);

    return true;
  } catch (error) {
    console.error("❌ Email sending FAILED!");
    console.error("  Error message:", error.message);
    console.error("  Full error:", error);
    return false;
  }
};

module.exports = { sendEmail };
