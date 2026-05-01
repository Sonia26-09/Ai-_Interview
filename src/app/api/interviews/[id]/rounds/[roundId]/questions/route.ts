import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Interview from "@/lib/models/Interview";
import Question from "@/lib/models/Question";

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

// ─── GET — List questions for a round ───────────────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; roundId: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id, roundId } = params;

        await dbConnect();

        // Verify interview ownership
        const interview = await Interview.findOne({ _id: id, createdBy: userId }).lean();
        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const questions = await Question.find({ interviewId: id, roundId })
            .sort({ order: 1 })
            .lean();

        const mapped = questions.map((q: any) => ({
            id: q._id.toString(),
            type: q.type,
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            techStack: q.techStack || [],
            options: q.options || [],
            correctOption: q.correctOption,
            starterCode: q.starterCode,
            functionName: q.functionName,
            testCases: q.testCases || [],
            expectedAnswer: q.expectedAnswer,
            aiHints: q.aiHints || [],
            tags: q.tags || [],
            points: q.points,
            order: q.order,
            isAIGenerated: q.isAIGenerated,
        }));

        return NextResponse.json({ questions: mapped }, { status: 200 });
    } catch (error: any) {
        if (error.name === "CastError") {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }
        console.error("Fetch questions error:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

// ─── POST — Add a question to a round ───────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; roundId: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id, roundId } = params;
        const body = await request.json();

        await dbConnect();

        // Verify interview ownership
        const interview = await Interview.findOne({ _id: id, createdBy: userId });
        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Get current question count for ordering
        const count = await Question.countDocuments({ interviewId: id, roundId });

        const question = await Question.create({
            interviewId: id,
            roundId,
            type: body.type || "aptitude",
            title: body.title || "Untitled Question",
            description: body.description || "",
            difficulty: body.difficulty || "Medium",
            techStack: body.techStack || [],
            options: body.options || [],
            correctOption: body.correctOption,
            starterCode: body.starterCode,
            functionName: body.functionName,
            testCases: body.testCases || [],
            expectedAnswer: body.expectedAnswer,
            aiHints: body.aiHints || [],
            tags: body.tags || [],
            points: body.points || 10,
            order: body.order ?? count + 1,
            isAIGenerated: body.isAIGenerated || false,
        });

        return NextResponse.json({
            message: "Question added",
            question: {
                id: question._id.toString(),
                title: question.title,
                type: question.type,
                order: question.order,
            },
        }, { status: 201 });
    } catch (error: any) {
        if (error.name === "CastError") {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }
        console.error("Add question error:", error);
        return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
    }
}
