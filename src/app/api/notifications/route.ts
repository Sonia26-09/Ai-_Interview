import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Notification from "@/lib/models/Notification";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
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
        
        const notifications = await Notification.find({ userId: String(payload.userId) })
            .sort({ createdAt: -1 })
            .limit(50); // Optional limit to prevent large payloads

        return NextResponse.json({ notifications }, { status: 200 });
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
