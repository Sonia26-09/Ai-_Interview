import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { verifyOTPToken } from "@/lib/otp";

export async function POST(req: Request) {
    try {
        const { email, otp, otpToken, newPassword } = await req.json();

        if (!otp || !otpToken || !newPassword) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Verify the OTP
        const verification = verifyOTPToken(otpToken, otp, "reset");
        if (!verification.valid) {
            return NextResponse.json(
                { error: verification.error },
                { status: 400 }
            );
        }

        await dbConnect();

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await User.findOneAndUpdate(
            { email: verification.email },
            { password: hashedPassword },
            { new: true }
        );

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        console.log(`[Reset-Password] ✅ Password reset for: ${user.email}`);

        return NextResponse.json({
            success: true,
            message: "Password reset successfully! Please sign in.",
        });
    } catch (error: any) {
        console.error("Reset password error:", error?.message);
        return NextResponse.json(
            { error: "Password reset failed. Please try again." },
            { status: 500 }
        );
    }
}
