import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Get the SMTP transporter.
 * Tries Brevo SMTP first, falls back to Gmail.
 */
function getTransporter() {
    const brevoUser = process.env.BREVO_SMTP_USER;
    const brevoPass = process.env.BREVO_SMTP_PASS;

    if (brevoUser && brevoPass) {
        return nodemailer.createTransport({
            host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
            port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
            secure: false,
            auth: { user: brevoUser, pass: brevoPass },
        });
    }

    // Fallback to Gmail
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: { user: emailUser, pass: emailPass },
        });
    }

    return null;
}

function getFromAddress(): string {
    if (process.env.BREVO_FROM_EMAIL) {
        return `"${process.env.BREVO_FROM_NAME || "AiMock"}" <${process.env.BREVO_FROM_EMAIL}>`;
    }
    return `"AiMock Security" <${process.env.EMAIL_USER || "noreply@aimock.dev"}>`;
}

/**
 * Send a generic email (used by existing 2FA login flow).
 */
export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
    // Always log OTP to console so it's visible during development
    console.log("\n========================================");
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Content: ${text}`);
    console.log("========================================\n");

    const transporter = getTransporter();
    if (!transporter) {
        console.warn("⚠️  No SMTP credentials configured — email not sent (OTP logged above).");
        return;
    }

    try {
        await transporter.verify();
        console.log("✅ SMTP connection verified");

        const info = await transporter.sendMail({
            from: getFromAddress(),
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

/**
 * Send a premium-styled OTP email for signup verification or password reset.
 */
export async function sendOTPEmail(
    to: string,
    name: string,
    otp: string,
    type: "verify" | "reset"
) {
    const isVerify = type === "verify";

    const subject = isVerify
        ? "Verify your AiMock account"
        : "Reset your AiMock password";

    const plainText = isVerify
        ? `Hi ${name}, your AiMock verification code is: ${otp}. This code expires in 10 minutes.`
        : `Hi ${name}, your AiMock password reset code is: ${otp}. This code expires in 10 minutes.`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4e;">
        
        <div style="background:linear-gradient(135deg,#6c47ff,#a855f7);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">AiMock</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">AI Mock Interview Platform</p>
        </div>

        <div style="padding:32px;">
          <h2 style="color:#e0e0e0;margin:0 0 8px;font-size:20px;">
            ${isVerify ? "Verify your email" : "Reset your password"}
          </h2>
          <p style="color:#a0a0c0;margin:0 0 24px;font-size:14px;line-height:1.6;">
            Hi <strong>${name}</strong>, ${isVerify
              ? "thanks for signing up! Use the code below to verify your email address."
              : "we received a request to reset your password. Use the code below to proceed."}
          </p>

          <div style="background:#0f0f1a;border:1px solid #3d3d6e;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <p style="color:#a0a0c0;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
            <div style="font-size:42px;font-weight:700;letter-spacing:12px;color:#a855f7;font-family:'Courier New',monospace;">
              ${otp}
            </div>
            <p style="color:#666;margin:12px 0 0;font-size:12px;">
              Valid for 10 minutes only
            </p>
          </div>

          <div style="background:#1e1e3a;border-left:3px solid #f59e0b;border-radius:4px;padding:12px 16px;margin:0 0 24px;">
            <p style="color:#f59e0b;margin:0;font-size:12px;">
              ⚠️ Never share this OTP with anyone. AiMock will never ask for it.
            </p>
          </div>

          <p style="color:#666;margin:0;font-size:12px;text-align:center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>

        <div style="background:#0f0f1a;padding:16px;text-align:center;border-top:1px solid #2d2d4e;">
          <p style="color:#444;margin:0;font-size:11px;">
            © ${new Date().getFullYear()} AiMock. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

    await sendEmail({ to, subject, text: plainText, html });
}