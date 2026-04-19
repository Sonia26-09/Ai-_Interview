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

// Strict email regex — domain must start with a letter, extension must be 2+ letters
// Blocks: ridhi@23gmail.com, abc@123.com, test@.com, user@gmail.c
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

// ─── POST /api/auth/login  { email, password, role } ─────────────────────────
export async function POST(req: Request) {
  try {
    // ── Step 1: Connect to database ──────────────────────────────────────
    console.log("[Login] Step 1: Connecting to database...");
    await dbConnect();
    console.log("[Login] Step 1: ✅ DB connected");

    // Debug: Log total user count to verify DB has data
    const totalUsers = await User.countDocuments();
    console.log("[Login] Debug: Total users in database:", totalUsers);

    const body = await req.json();
    const { email, password, role } = body;

    // ── Step 2: Validate required fields ──────────────────────────────────
    if (!email || !password || !role) {
      console.log("[Login] Step 2: ❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    console.log("[Login] Step 2: ✅ Fields present — email:", email, "role:", role);

    // ── Step 3: Validate email format (server-side — mandatory) ──────────
    // Frontend validation can be bypassed, so always validate on backend too
    if (!EMAIL_REGEX.test(email)) {
      console.log("[Login] Step 3: ❌ Invalid email format:", email);
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. name@example.com)" },
        { status: 400 }
      );
    }
    console.log("[Login] Step 3: ✅ Email format valid");

    // ── Step 4 ke baad, Step 5 se pehle — yeh add karo ──
const normalizedEmail = email.toLowerCase().trim();
console.log("[Login] Step 4: Normalized email:", normalizedEmail);

// 👇 YEH NAYA LINE ADD KARO
const allUsers = await User.find({}, { email: 1, role: 1, _id: 0 });
console.log("[Login] Debug ALL users in DB:", JSON.stringify(allUsers));

// Step 5 continue...
const user = await User.findOne({ email: normalizedEmail, role });
    if (!user) {
      // Debug: Check if user exists with different role
      const userWithAnyRole = await User.findOne({ email: normalizedEmail });
      if (userWithAnyRole) {
        console.log("[Login] Step 5: ❌ User exists but with role:", userWithAnyRole.role, "(tried:", role, ")");
        return NextResponse.json(
          { error: `No account found with this email as ${role}. Try signing in as ${userWithAnyRole.role}.` },
          { status: 401 }
        );
      }
      console.log("[Login] Step 5: ❌ No account found for email:", normalizedEmail);
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 401 }
      );
    }
    console.log("[Login] Step 5: ✅ User found — ID:", user._id);

    // ── Step 6: Verify password ───────────────────────────────────────────
    // Sign In: use bcrypt.compare(plainPassword, storedHash)
    // DO NOT hash the input password again — bcrypt.compare handles it
    console.log("[Login] Step 6: Verifying password...");
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      console.log("[Login] Step 6: ❌ Password does not match");
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }
    console.log("[Login] Step 6: ✅ Password verified");

    // ── 6. 2FA gate ────────────────────────────────────────────────────────
    if (user.preferences?.security?.twoFactorEnabled) {
      console.log("[Login] 2FA enabled for user, sending OTP");

      // Rate-limit: max 3 OTP requests in 15 minutes
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
      const recentCount = await OTP.countDocuments({
        userId:    user._id,
        intent:    "login",
        createdAt: { $gte: windowStart },
      });

      if (recentCount >= MAX_OTP_REQUESTS) {
        console.log("[Login] Rate limit exceeded for user:", user._id);
        return NextResponse.json(
          { error: "Too many OTP requests. Please wait 15 minutes before trying again." },
          { status: 429 }
        );
      }

      // Generate cryptographically secure OTP
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

      console.log("[Login] OTP sent to:", user.email);

      // Never issue the JWT here — return userId so frontend can call verify-login
      return NextResponse.json(
        { require2Fa: true, userId: user._id, message: "OTP sent to your email" },
        { status: 200 }
      );
    }

    // ── 7. No 2FA — issue JWT directly ─────────────────────────────────────
    const token = await new SignJWT({ userId: user._id.toString(), role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(encodedSecret);
    console.log("[Login] Step 7: ✅ JWT token generated");

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
    console.log("[Login] Step 8: ✅ Auth cookie set — LOGIN COMPLETE");

    return response;

  } catch (error: any) {
    console.error("[Login] Error:", error?.message, error?.stack);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
