import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { verifyOTPToken } from "@/lib/otp";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function POST(req: Request) {
    try {
        const { name, email, password, otp, otpToken, role, company, techStack } = await req.json();

        if (!otp || !otpToken) {
            return NextResponse.json(
                { error: "OTP and token are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verify the OTP
        const verification = verifyOTPToken(otpToken, otp, "verify");
        if (!verification.valid) {
            return NextResponse.json(
                { error: verification.error },
                { status: 400 }
            );
        }

        if (verification.email !== normalizedEmail) {
            return NextResponse.json(
                { error: "Email mismatch" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create or update (upsert) the user — handles case where unverified user exists
        const user = await User.findOneAndUpdate(
            { email: normalizedEmail },
            {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role: role || "student",
                isVerified: true,
                company: role === "recruiter" ? company : undefined,
                techStack: role === "student" ? techStack : undefined,
            },
            { upsert: true, new: true }
        );

        console.log(`[Verify-OTP] ✅ User created/verified: ${user.email} (ID: ${user._id})`);

        // Generate JWT token — same as existing signup flow
        const token = await new SignJWT({ userId: user._id.toString(), role: user.role })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(encodedSecret);

        const response = NextResponse.json({
            success: true,
            message: "Account created successfully!",
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });

        // Set auth cookie — same as existing login flow
        response.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error: any) {
        console.error("Verify OTP error:", error?.message);
        return NextResponse.json(
            { error: "Verification failed. Please try again." },
            { status: 500 }
        );
    }
}
