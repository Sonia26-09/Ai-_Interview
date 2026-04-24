import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.json();
        const { name, email, password, role, company, techStack } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!EMAIL_REGEX.test(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address (e.g. name@example.com)" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists with this email" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role,
            company: role === "recruiter" ? company : undefined,
            techStack: role === "student" ? techStack : undefined,
            // Stats initialized to zero via schema defaults
        });

        // Verify user was saved
        const verifyUser = await User.findById(newUser._id);
        if (!verifyUser) {
            console.error("[Signup] CRITICAL: User created but not found in DB");
            return NextResponse.json({ error: "Account creation failed. Please try again." }, { status: 500 });
        }

        const token = await new SignJWT({ userId: newUser._id.toString(), role: newUser.role })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(encodedSecret);

        const response = NextResponse.json({
            message: "User created successfully",
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        }, { status: 201 });

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
        console.error("[Signup] Error:", error?.message);
        return NextResponse.json(
            { error: "Could not create account. Please try again." },
            { status: 500 }
        );
    }
}
