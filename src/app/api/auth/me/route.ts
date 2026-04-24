import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

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
        
        const user = await User.findById(payload.userId).select("-password");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company,
                techStack: user.techStack || [],
                // Stats
                xp: user.xp ?? 0,
                level: user.level ?? 1,
                streak: user.streak ?? 0,
                totalAttempts: user.totalAttempts ?? 0,
                averageScore: user.averageScore ?? 0,
                badges: user.badges ?? [],
                totalInterviews: user.totalInterviews ?? 0,
                activeRoles: user.activeRoles ?? 0,
                // Preferences
                preferences: user.preferences,
                createdAt: user.createdAt,
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Auth me error:", error);
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
}
