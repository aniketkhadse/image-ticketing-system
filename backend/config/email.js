const sendEmail = async (to, subject, html, fromName = "Ticketing System") => {
  try {
    console.log("📧 Attempting to send email via Resend API...");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

    // Use Resend HTTP API instead of SMTP
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${fromName} <onboarding@resend.dev>`,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Resend API Error:");
      console.error("  Status:", response.status);
      console.error("  Response:", data);
      return false;
    }

    console.log("✅ Email sent successfully!");
    console.log("  Email ID:", data.id);
    return true;
  } catch (error) {
    console.error("❌ Email sending FAILED!");
    console.error("  Error message:", error.message);
    console.error("  Full error:", error);
    return false;
  }
};

module.exports = { sendEmail };
