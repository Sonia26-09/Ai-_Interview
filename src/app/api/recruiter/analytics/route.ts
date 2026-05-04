import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Interview from "@/lib/models/Interview";
import Submission from "@/lib/models/Submission";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, encodedSecret);
        return (payload.userId as string) || null;
    } catch {
        return null;
    }
}

// ─── GET /api/recruiter/analytics — Aggregate analytics for recruiter ────
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();

        // Get all interviews by this recruiter
        const interviews = await Interview.find({ createdBy: userId })
            .select("title status rounds passingScore techStack applicants createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const interviewIds = interviews.map((i: any) => i._id);

        // Get all submissions for these interviews
        const allSubmissions = await Submission.find({ interviewId: { $in: interviewIds } })
            .sort({ completedAt: -1 })
            .lean();

        // ── Aggregate stats ─────────────────────────────────────────
        const totalApplicants = allSubmissions.length;
        const totalInterviews = interviews.length;
        const scores = allSubmissions.map((s: any) => s.overallScore);
        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
            : 0;
        const selectedCount = allSubmissions.filter((s: any) => s.status === "selected").length;
        const passRate = totalApplicants > 0
            ? Math.round((selectedCount / totalApplicants) * 100)
            : 0;

        // Score distribution
        const scoreDistribution = [
            { range: "0-20", count: 0 },
            { range: "21-40", count: 0 },
            { range: "41-60", count: 0 },
            { range: "61-80", count: 0 },
            { range: "81-100", count: 0 },
        ];
        scores.forEach((s: number) => {
            if (s <= 20) scoreDistribution[0].count++;
            else if (s <= 40) scoreDistribution[1].count++;
            else if (s <= 60) scoreDistribution[2].count++;
            else if (s <= 80) scoreDistribution[3].count++;
            else scoreDistribution[4].count++;
        });

        // Weekly applications (last 7 days)
        const now = new Date();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyApplications = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() - (6 - i));
            return { day: dayNames[d.getDay()], count: 0, date: d.toISOString().split("T")[0] };
        });

        allSubmissions.forEach((s: any) => {
            const sDate = new Date(s.completedAt).toISOString().split("T")[0];
            const entry = weeklyApplications.find(w => w.date === sDate);
            if (entry) entry.count++;
        });

        // Per-interview summary
        const perInterview = interviews.map((iv: any) => {
            const subs = allSubmissions.filter(
                (s: any) => s.interviewId.toString() === iv._id.toString()
            );
            const ivScores = subs.map((s: any) => s.overallScore);
            const ivAvg = ivScores.length > 0
                ? Math.round(ivScores.reduce((a: number, b: number) => a + b, 0) / ivScores.length)
                : 0;
            const ivSelected = subs.filter((s: any) => s.status === "selected").length;
            const ivRejected = subs.filter((s: any) => s.status === "rejected").length;

            return {
                id: iv._id.toString(),
                title: iv.title,
                status: iv.status,
                rounds: (iv.rounds || []).length,
                passingScore: iv.passingScore,
                totalApplicants: subs.length,
                averageScore: ivAvg,
                selected: ivSelected,
                rejected: ivRejected,
                createdAt: iv.createdAt,
            };
        });

        // Top tech stacks
        const techCount: Record<string, number> = {};
        interviews.forEach((iv: any) => {
            (iv.techStack || []).forEach((t: string) => {
                techCount[t] = (techCount[t] || 0) + 1;
            });
        });
        const topTechStacks = Object.entries(techCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        return NextResponse.json({
            totalApplicants,
            totalInterviews,
            averageScore,
            passRate,
            selectedCount,
            rejectedCount: totalApplicants - selectedCount,
            scoreDistribution,
            weeklyApplications: weeklyApplications.map(({ day, count }) => ({ day, count })),
            perInterview,
            topTechStacks,
        }, { status: 200 });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
