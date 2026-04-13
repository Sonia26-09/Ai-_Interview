import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

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

        const body = await request.json();
        
        await dbConnect();
        
        // Deep merge updates using MongoDB dot notation where possible or just replace the preferences object
        // Assuming body contains { preferences: { ... } }
        const updatedUser = await User.findByIdAndUpdate(
            payload.userId,
            { $set: { "preferences": body.preferences } },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Preferences updated successfully", preferences: updatedUser.preferences }, { status: 200 });

    } catch (error) {
        console.error("Preferences update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
