import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

/**
 * GET /api/leaderboard
 * Returns all students sorted by averageScore descending.
 * Includes the current user's ID so the frontend can tag "You".
 */
export async function GET(request: NextRequest) {
    try {
        let currentUserId: string | null = null;

        // Try to identify the current user (optional — leaderboard still works without auth)
        const token = request.cookies.get("auth-token")?.value;
        if (token) {
            try {
                const { payload } = await jwtVerify(token, encodedSecret);
                currentUserId = payload.userId as string;
            } catch {
                // Invalid token — just don't tag "You"
            }
        }

        await dbConnect();

        // Fetch all students who have at least 1 attempt, sorted by averageScore desc
        const students = await User.find({
            role: "student",
            totalAttempts: { $gte: 1 },
        })
            .select("name xp level streak totalAttempts averageScore badges")
            .sort({ averageScore: -1, xp: -1 })
            .limit(50)
            .lean();

        const leaderboard = students.map((s: any, index: number) => ({
            rank: index + 1,
            id: s._id.toString(),
            name: s.name,
            averageScore: s.averageScore ?? 0,
            totalAttempts: s.totalAttempts ?? 0,
            streak: s.streak ?? 0,
            xp: s.xp ?? 0,
            level: s.level ?? 1,
            badgeCount: Array.isArray(s.badges) ? s.badges.length : 0,
            isYou: s._id.toString() === currentUserId,
        }));

        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
