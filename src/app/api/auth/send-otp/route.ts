import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { generateOTP, createOTPToken } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/utils/sendEmail";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email and password are required" },
                { status: 400 }
            );
        }

        if (!EMAIL_REGEX.test(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        await dbConnect();

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser && existingUser.isVerified) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const otp = generateOTP();
        const otpToken = createOTPToken(normalizedEmail, otp, "verify");

        console.log(`[Send-OTP] OTP for ${normalizedEmail}: ${otp}`);

        await sendOTPEmail(normalizedEmail, name, otp, "verify");

        return NextResponse.json({
            success: true,
            otpToken,
            message: "OTP sent to your email",
        });
    } catch (error: any) {
        console.error("Send OTP error:", error?.message);
        return NextResponse.json(
            { error: "Failed to send OTP. Please try again." },
            { status: 500 }
        );
    }
}
