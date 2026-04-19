import { NextResponse } from "next/server";
export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { sendEmail } from "@/lib/utils/sendEmail";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

const OTP_EXPIRY_MS     = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS      = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_REQUESTS  = 3;

// ─── POST /api/auth/2fa/setup  { action: "generate" } ────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { payload } = await jwtVerify(token, encodedSecret);
    if (!payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    if (body.action !== "generate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // ── Rate-limit: max 3 OTP requests per 15 min ─────────────────────────────
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
    const recentCount = await OTP.countDocuments({
      userId: user._id,
      intent: "setup",
      createdAt: { $gte: windowStart },
    });

    if (recentCount >= MAX_OTP_REQUESTS) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // ── Generate cryptographically secure OTP ─────────────────────────────────
    const otpCode   = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 12);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await OTP.create({
      userId:   user._id,
      email:    user.email,
      otp:      hashedOtp,
      intent:   "setup",
      expiresAt,
    });

    await sendEmail({
      to:      user.email,
      subject: "Your AiMock 2FA Setup Code",
      text:    `Your 2FA setup code is: ${otpCode}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      html:    `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#06b6d4">Enable Two-Factor Authentication</h2>
          <p>Use the code below to complete your 2FA setup:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0f172a;background:#f1f5f9;padding:16px 24px;border-radius:8px;text-align:center">
            ${otpCode}
          </div>
          <p style="color:#64748b;font-size:14px;margin-top:16px">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>`,
    });

    return NextResponse.json({ message: "OTP sent to your email" }, { status: 200 });

  } catch (error: any) {
    console.error("2FA setup POST error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

// ─── PUT /api/auth/2fa/setup  { action: "verify", otp: "123456" } ────────────
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { payload } = await jwtVerify(token, encodedSecret);
    if (!payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    if (body.action !== "verify") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { otp } = body;
    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Fetch the most recent setup OTP for this user
    const record = await OTP.findOne({ userId: user._id, intent: "setup" })
      .sort({ createdAt: -1 });

    // Generic message — never reveal whether it was expired vs wrong
    const GENERIC_ERROR = "Invalid or expired code";

    if (!record) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // ── Server-side expiry check ───────────────────────────────────────────────
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // ── Brute-force lock ──────────────────────────────────────────────────────
    if (record.attempts >= MAX_ATTEMPTS) {
      await OTP.deleteOne({ _id: record._id });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // ── bcrypt compare (never plain ===) ─────────────────────────────────────
    const isMatch = await bcrypt.compare(otp.trim(), record.otp);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // ── Success: delete OTP, enable 2FA ──────────────────────────────────────
    await OTP.deleteMany({ userId: user._id, intent: "setup" });

    user.preferences.security.twoFactorEnabled = true;
    await user.save();

    return NextResponse.json(
      { message: "2FA enabled successfully.", preferences: user.preferences },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("2FA setup PUT error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
