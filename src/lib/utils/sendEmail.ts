import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Always log OTP to console so it's visible during development
  console.log("\n========================================");
  console.log(`📧 Sending email to: ${to}`);
  console.log(`📝 Subject: ${subject}`);
  console.log(`📄 Content: ${text}`);
  console.log("========================================\n");

  if (!emailUser || !emailPass) {
    console.warn("⚠️  EMAIL_USER / EMAIL_PASS not set — email not sent (OTP logged above).");
    return; // Don't throw — OTP is visible in console for dev
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");

    const info = await transporter.sendMail({
      from: `"AiMock Security" <${emailUser}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent: ${info.response}`);
  } catch (err: any) {
    console.error("❌ SMTP send failed:", err.message);
    // Don't throw — OTP is already logged above so dev flow isn't broken
  }
}