import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Notification from "@/lib/models/Notification";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function PUT(request: NextRequest) {
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
        
        const body = await request.json().catch(() => ({}));
        const { notificationId } = body;

        if (notificationId) {
            // Mark a single notification as read
            const updated = await Notification.findOneAndUpdate(
                { _id: notificationId, userId: String(payload.userId) },
                { $set: { read: true } },
                { new: true }
            );

            if (!updated) {
                return NextResponse.json({ error: "Notification not found" }, { status: 404 });
            }

            return NextResponse.json({ message: "Notification marked as read", notification: updated }, { status: 200 });
        } else {
            // Mark all notifications as read for the user
            await Notification.updateMany(
                { userId: String(payload.userId), read: false },
                { $set: { read: true } }
            );

            return NextResponse.json({ message: "All notifications marked as read" }, { status: 200 });
        }
    } catch (error) {
        console.error("Update notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
