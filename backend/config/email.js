const fetch = require("node-fetch");

const sendEmail = async (to, subject, html, fromName = "Ticketing System") => {
  try {
    console.log("📧 Attempting to send email via SendGrid HTTP API...");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  SENDGRID_API_KEY present:", !!process.env.SENDGRID_API_KEY);

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: { email: "aniket@aristasystems.in", name: fromName },
        content: [
          {
            type: "text/html",
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ SendGrid API Error:", errText);
      return false;
    }

    console.log("✅ Email sent successfully via SendGrid API!");
    return true;
  } catch (error) {
    console.error("❌ Email sending FAILED!");
    console.error("  Error message:", error.message);
    console.error("  Full error:", error);
    return false;
  }
};

module.exports = { sendEmail };
