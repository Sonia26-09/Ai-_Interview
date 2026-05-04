import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Submission from "@/lib/models/Submission";
import Interview from "@/lib/models/Interview";
import User from "@/lib/models/User";

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

// ─── POST /api/interviews/[id]/submissions — Save a student submission ───
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id: interviewId } = params;
        const body = await request.json();
        const { overallScore, roundScores } = body;

        if (typeof overallScore !== "number") {
            return NextResponse.json({ error: "overallScore is required" }, { status: 400 });
        }

        await dbConnect();

        // Get interview to determine passing score
        const interview = await Interview.findById(interviewId).select("passingScore createdBy").lean() as any;
        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const passingScore = interview.passingScore || 70;
        const status = overallScore >= passingScore ? "selected" : "rejected";

        // Upsert — one submission per user per interview
        const submission = await Submission.findOneAndUpdate(
            { interviewId, userId },
            {
                overallScore,
                roundScores: roundScores || [],
                status,
                completedAt: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Update applicants count based on unique submissions
        const uniqueCount = await Submission.countDocuments({ interviewId });
        await Interview.findByIdAndUpdate(interviewId, { applicants: uniqueCount });

        return NextResponse.json({
            success: true,
            submission: {
                id: submission._id.toString(),
                status,
                overallScore,
            },
        }, { status: 201 });
    } catch (error: any) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
            return NextResponse.json({ error: "Already submitted" }, { status: 409 });
        }
        console.error("Submission error:", error);
        return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }
}

// ─── GET /api/interviews/[id]/submissions — Get all submissions (recruiter) ─
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id: interviewId } = params;

        await dbConnect();

        // Verify recruiter owns the interview
        const interview = await Interview.findOne({ _id: interviewId, createdBy: userId })
            .select("title passingScore")
            .lean() as any;
        if (!interview) {
            return NextResponse.json({ error: "Interview not found or not authorized" }, { status: 404 });
        }

        // Fetch all submissions for this interview
        const submissions = await Submission.find({ interviewId })
            .sort({ completedAt: -1 })
            .lean();

        // Get user details for each submission
        const userIds = submissions.map((s: any) => s.userId);
        const users = await User.find({ _id: { $in: userIds } })
            .select("name email")
            .lean();
        const userMap: Record<string, { name: string; email: string }> = {};
        users.forEach((u: any) => {
            userMap[u._id.toString()] = { name: u.name, email: u.email };
        });

        const mapped = submissions.map((s: any) => {
            const user = userMap[s.userId.toString()] || { name: "Unknown", email: "" };
            return {
                id: s._id.toString(),
                studentName: user.name,
                studentEmail: user.email,
                overallScore: s.overallScore,
                roundScores: s.roundScores,
                status: s.status,
                completedAt: s.completedAt,
            };
        });

        return NextResponse.json({
            interviewTitle: interview.title,
            passingScore: interview.passingScore,
            submissions: mapped,
        }, { status: 200 });
    } catch (error) {
        console.error("Fetch submissions error:", error);
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }
}
