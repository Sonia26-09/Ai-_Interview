import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Notification from "@/lib/models/Notification";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, encodedSecret);

        if (!payload.userId) {
            return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
        }

        await dbConnect();
        
        const notification = await Notification.create({
            userId: String(payload.userId),
            title: "Welcome to AiMock!",
            message: "This is a dummy notification to test the new functionality. Click to mark complete.",
            read: false,
        });

        // Add a second one for testing mass-read
        await Notification.create({
            userId: String(payload.userId),
            title: "New AI Model Available",
            message: "We just upgraded our core AI. Your practice interviews just got more realistic.",
            read: false,
        });

        return NextResponse.json({ message: "Dummy notifications created" }, { status: 201 });
    } catch (error) {
        console.error("Create dummy notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
