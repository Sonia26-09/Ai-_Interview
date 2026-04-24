import { NextResponse } from "next/server";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import crypto from "crypto";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { sendEmail } from "@/lib/utils/sendEmail";

const JWT_SECRET    = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

const OTP_EXPIRY_MS     = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_REQUESTS  = 3;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. name@example.com)" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail, role });
    if (!user) {
      const userWithAnyRole = await User.findOne({ email: normalizedEmail });
      if (userWithAnyRole) {
        return NextResponse.json(
          { error: `No account found with this email as ${role}. Try signing in as ${userWithAnyRole.role}.` },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (user.isVerified === false) {
      return NextResponse.json(
        { error: "Please verify your email first. Sign up again to receive a new OTP." },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // 2FA gate
    if (user.preferences?.security?.twoFactorEnabled) {
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
      const recentCount = await OTP.countDocuments({
        userId:    user._id,
        intent:    "login",
        createdAt: { $gte: windowStart },
      });

      if (recentCount >= MAX_OTP_REQUESTS) {
        return NextResponse.json(
          { error: "Too many OTP requests. Please wait 15 minutes before trying again." },
          { status: 429 }
        );
      }

      const otpCode   = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = await bcrypt.hash(otpCode, 12);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      await OTP.create({
        userId: user._id,
        email:  user.email,
        otp:    hashedOtp,
        intent: "login",
        expiresAt,
      });

      await sendEmail({
        to:      user.email,
        subject: "Your AiMock Login Code",
        text:    `Your login verification code is: ${otpCode}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
        html:    `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#06b6d4">Login Verification</h2>
            <p>Enter this code to complete your login:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0f172a;background:#f1f5f9;padding:16px 24px;border-radius:8px;text-align:center">
              ${otpCode}
            </div>
            <p style="color:#64748b;font-size:14px;margin-top:16px">
              This code expires in <strong>10 minutes</strong>. If you didn't request this, please secure your account.
            </p>
          </div>`,
      });

      return NextResponse.json(
        { require2Fa: true, userId: user._id, message: "OTP sent to your email" },
        { status: 200 }
      );
    }

    // No 2FA — issue JWT directly
    const token = await new SignJWT({ userId: user._id.toString(), role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(encodedSecret);

    const response = NextResponse.json(
      { message: "Login successful", user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 200 }
    );

    response.cookies.set({
      name:     "auth-token",
      value:    token,
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   7 * 24 * 60 * 60,
    });

    return response;

  } catch (error: any) {
    console.error("[Login] Error:", error?.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
