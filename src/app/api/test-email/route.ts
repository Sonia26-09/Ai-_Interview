import { NextResponse } from "next/server";

// 🔥 MUST (env + nodemailer ke liye)
export const runtime = "nodejs";

import { sendEmail } from "@/lib/utils/sendEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    console.log(`[API] Request received for email: ${email}`);

    // ✅ ENV debug (optional)
    console.log("ENV EMAIL_USER:", process.env.EMAIL_USER);
    console.log(
      "ENV EMAIL_PASS:",
      process.env.EMAIL_PASS ? "***[CENSORED]***" : "undefined"
    );

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    // 🔥 STEP 1: OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

    // 🔥 STEP 2: Send OTP email
    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
    });

    console.log("✅ OTP Email sent");

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to send OTP",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}