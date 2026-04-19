import { NextResponse } from "next/server";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";

const JWT_SECRET    = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);
const MAX_ATTEMPTS  = 5;
const GENERIC_ERROR = "Invalid or expired code";

// ─── POST /api/auth/2fa/verify-login  { userId, otp } ────────────────────────
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, otp } = body;

    if (!userId || !otp || typeof otp !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // Fetch the most recent login OTP for this user
    const record = await OTP.findOne({ userId, intent: "login" }).sort({ createdAt: -1 });

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

    // ── bcrypt compare (never plain ===) ──────────────────────────────────────
    const isMatch = await bcrypt.compare(otp.trim(), record.otp);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // ── Success: delete used OTP, issue JWT ───────────────────────────────────
    await OTP.deleteMany({ userId, intent: "login" });

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
    console.error("verify-login error:", error?.message, error?.stack);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
