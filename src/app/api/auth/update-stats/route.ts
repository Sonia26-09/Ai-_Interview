import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

/**
 * POST /api/auth/update-stats
 * Called after a student completes an interview to update their real stats.
 * Body: { overallScore: number, xpEarned: number }
 */
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

        const body = await request.json();
        const { overallScore, xpEarned } = body;

        if (typeof overallScore !== "number" || typeof xpEarned !== "number") {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(payload.userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // ── Update stats ────────────────────────────────────────
        const prevAttempts = user.totalAttempts ?? 0;
        const prevAvgScore = user.averageScore ?? 0;
        const newAttempts = prevAttempts + 1;

        // Recalculate running average score
        const newAvgScore = Math.round(
            ((prevAvgScore * prevAttempts) + overallScore) / newAttempts
        );

        // XP and level
        const newXp = (user.xp ?? 0) + xpEarned;
        const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

        // Streak — increment if last attempt was within 24h, else reset to 1
        const now = new Date();
        const lastUpdated = user.updatedAt ? new Date(user.updatedAt) : null;
        const hoursSinceLastUpdate = lastUpdated
            ? (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
            : Infinity;
        const newStreak = hoursSinceLastUpdate <= 48
            ? (user.streak ?? 0) + 1
            : 1;

        // ── Badge checks ────────────────────────────────────────
        const existingBadges = user.badges ?? [];
        const badgeIds = new Set(existingBadges.map((b: any) => b.id));
        const newBadges = [...existingBadges];

        // First Interview badge
        if (!badgeIds.has("first-interview") && newAttempts >= 1) {
            newBadges.push({
                id: "first-interview",
                name: "First Step",
                description: "Completed your first interview",
                icon: "🎯",
                color: "cyan",
                earnedAt: now,
            });
        }

        // 5 Interviews badge
        if (!badgeIds.has("five-interviews") && newAttempts >= 5) {
            newBadges.push({
                id: "five-interviews",
                name: "Consistent",
                description: "Completed 5 interviews",
                icon: "🔥",
                color: "orange",
                earnedAt: now,
            });
        }

        // 10 Interviews badge
        if (!badgeIds.has("ten-interviews") && newAttempts >= 10) {
            newBadges.push({
                id: "ten-interviews",
                name: "Code Warrior",
                description: "Completed 10 interviews",
                icon: "⚡",
                color: "cyan",
                earnedAt: now,
            });
        }

        // High scorer badge
        if (!badgeIds.has("high-scorer") && overallScore >= 85) {
            newBadges.push({
                id: "high-scorer",
                name: "Top Performer",
                description: "Scored 85%+ in an interview",
                icon: "🏆",
                color: "green",
                earnedAt: now,
            });
        }

        // Streak badge
        if (!badgeIds.has("streak-7") && newStreak >= 7) {
            newBadges.push({
                id: "streak-7",
                name: "Streak Master",
                description: "7-day practice streak",
                icon: "🔥",
                color: "orange",
                earnedAt: now,
            });
        }

        // ── Save to DB ──────────────────────────────────────────
        user.totalAttempts = newAttempts;
        user.averageScore = newAvgScore;
        user.xp = newXp;
        user.level = newLevel;
        user.streak = newStreak;
        user.badges = newBadges;

        await user.save();

        return NextResponse.json({
            success: true,
            stats: {
                totalAttempts: newAttempts,
                averageScore: newAvgScore,
                xp: newXp,
                level: newLevel,
                streak: newStreak,
                badges: newBadges,
            },
        });
    } catch (error) {
        console.error("Update stats error:", error);
        return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
    }
}
