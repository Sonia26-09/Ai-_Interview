import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongoose";
import Interview from "@/lib/models/Interview";
import Question from "@/lib/models/Question";

// ─── GET /api/interviews/[id]/questions ─────────────────────────────
// ?roundType=aptitude|coding  → filter by round type
// Returns all recruiter-defined questions for an interview
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
        }

        const url = new URL(request.url);
        const roundType = url.searchParams.get("roundType");

        await dbConnect();

        // Verify interview exists and is active
        const interview = await Interview.findOne({
            _id: id,
            status: { $in: ["active", "paused"] },
        }).lean();

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Build query
        const query: any = { interviewId: id };
        if (roundType) {
            query.type = roundType;
        }

        const questions = await Question.find(query)
            .sort({ order: 1 })
            .lean();

        // Map for frontend consumption
        const mapped = questions.map((q: any) => {
            const base: any = {
                id: q._id.toString(),
                type: q.type,
                title: q.title,
                description: q.description,
                difficulty: q.difficulty,
                tags: q.tags || [],
                points: q.points,
                order: q.order,
            };

            if (q.type === "aptitude") {
                base.options = q.options || [];
                base.correctOption = q.correctOption;
            }

            if (q.type === "coding") {
                base.starterCode = q.starterCode || {};
                base.functionName = q.functionName || "";
                base.testCases = (q.testCases || []).map((tc: any, i: number) => ({
                    id: tc._id?.toString() || `tc-${i + 1}`,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: tc.isHidden || false,
                    description: tc.description || `Test Case ${i + 1}`,
                }));
                base.aiHints = q.aiHints || [];
            }

            return base;
        });

        return NextResponse.json({ questions: mapped }, { status: 200 });
    } catch (error: any) {
        if (error.name === "CastError" || error.kind === "ObjectId") {
            return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
        }
        console.error("Fetch questions error:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
