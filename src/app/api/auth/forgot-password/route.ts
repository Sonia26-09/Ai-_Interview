import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { generateOTP, createOTPToken } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/utils/sendEmail";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Security: always return success even if email doesn't exist
        if (!user || !user.isVerified) {
            return NextResponse.json({
                success: true,
                message: "If this email is registered, an OTP has been sent.",
            });
        }

        const otp = generateOTP();
        const otpToken = createOTPToken(normalizedEmail, otp, "reset");

        console.log(`[Forgot-Password] OTP for ${normalizedEmail}: ${otp}`);

        await sendOTPEmail(normalizedEmail, user.name, otp, "reset");

        return NextResponse.json({
            success: true,
            otpToken,
            message: "OTP sent to your email",
        });
    } catch (error: any) {
        console.error("Forgot password error:", error?.message);
        return NextResponse.json(
            { error: "Failed to send OTP. Please try again." },
            { status: 500 }
        );
    }
}
