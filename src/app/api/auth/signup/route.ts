import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

// Strict email regex — domain must start with a letter, extension must be 2+ letters
// Blocks: ridhi@23gmail.com, abc@123.com, test@.com, user@gmail.c
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
    try {
        // ── Step 1: Connect to database ──────────────────────────────────────
        console.log("[Signup] Step 1: Connecting to database...");
        await dbConnect();
        console.log("[Signup] Step 1: ✅ DB connected");

        // ── Step 2: Parse request body ───────────────────────────────────────
        const body = await req.json();
        const { name, email, password, role, company, techStack } = body;
        console.log("[Signup] Step 2: Request received for email:", email, "role:", role);

        // ── Step 3: Validate required fields ─────────────────────────────────
        if (!name || !email || !password || !role) {
            console.log("[Signup] Step 3: ❌ Missing required fields");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        console.log("[Signup] Step 3: ✅ All required fields present");

        // ── Step 4: Validate email format (server-side — mandatory) ──────────
        if (!EMAIL_REGEX.test(email)) {
            console.log("[Signup] Step 4: ❌ Invalid email format:", email);
            return NextResponse.json(
                { error: "Please enter a valid email address (e.g. name@example.com)" },
                { status: 400 }
            );
        }
        console.log("[Signup] Step 4: ✅ Email format valid");

        // ── Step 5: Normalize email — lowercase + trim ───────────────────────
        const normalizedEmail = email.toLowerCase().trim();
        console.log("[Signup] Step 5: Normalized email:", normalizedEmail);

        // ── Step 6: Check if user already exists ─────────────────────────────
        console.log("[Signup] Step 6: Checking if user exists...");
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            console.log("[Signup] Step 6: ❌ User already exists with email:", normalizedEmail);
            return NextResponse.json({ error: "User already exists with this email" }, { status: 409 });
        }
        console.log("[Signup] Step 6: ✅ Email is available");

        // ── Step 7: Hash password — bcrypt with salt rounds = 10 ─────────────
        // Sign Up: hash the plain password ONCE before storing
        // NEVER store plain text passwords in the database
        console.log("[Signup] Step 7: Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("[Signup] Step 7: ✅ Password hashed successfully");

        // ── Step 8: Save user to database ────────────────────────────────────
        console.log("[Signup] Step 8: Saving user to database...");
        const newUser = await User.create({
            name,
            email: normalizedEmail, // Always store normalized (lowercase + trimmed) email
            password: hashedPassword, // Store the bcrypt hash, NOT plain text
            role,
            company: role === "recruiter" ? company : undefined,
            techStack: role === "student" ? techStack : undefined,
        });
        console.log("[Signup] Step 8: ✅ User saved! ID:", newUser._id, "Email:", newUser.email);

        // ── Step 9: Verify user was actually saved ───────────────────────────
        const verifyUser = await User.findById(newUser._id);
        if (!verifyUser) {
            console.error("[Signup] Step 9: ❌ CRITICAL — User was created but cannot be found in DB!");
            return NextResponse.json({ error: "Account creation failed. Please try again." }, { status: 500 });
        }
        console.log("[Signup] Step 9: ✅ Verified — user exists in DB with ID:", verifyUser._id);

        // ── Step 10: Generate JWT token ──────────────────────────────────────
        const token = await new SignJWT({ userId: newUser._id.toString(), role: newUser.role })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(encodedSecret);
        console.log("[Signup] Step 10: ✅ JWT token generated");

        const response = NextResponse.json({
            message: "User created successfully",
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        }, { status: 201 });

        // ── Step 11: Set HTTP-only cookie ────────────────────────────────────
        response.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        console.log("[Signup] Step 11: ✅ Auth cookie set — SIGNUP COMPLETE");

        return response;
    } catch (error: any) {
        console.error("[Signup] ❌ ERROR at step:", error?.message);
        console.error("[Signup] Stack trace:", error?.stack);
        return NextResponse.json(
            { error: "Could not create account. Please try again." },
            { status: 500 }
        );
    }
}
