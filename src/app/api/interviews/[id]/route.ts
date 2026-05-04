import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Interview from "@/lib/models/Interview";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

// ─── Helper: extract userId from auth-token cookie ──────────────────
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

// ─── GET /api/interviews/[id] — Fetch a single interview ────────────
// ?public=true → public access for students (no auth, returns active/paused interviews)
// Default      → recruiter access (auth + ownership required)
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
        const isPublic = url.searchParams.get("public") === "true";

        await dbConnect();

        let int: any;

        if (isPublic) {
            // Public access — students can view any non-draft interview
            int = await Interview.findOne({
                _id: id,
                status: { $in: ["active", "paused"] },
            }).lean();
        } else {
            // Recruiter access — requires auth + ownership
            const userId = await getUserId(request);
            if (!userId) {
                return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
            }
            int = await Interview.findOne({ _id: id, createdBy: userId }).lean();
        }

        if (!int) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Fetch creator name for public view
        let recruiterName = "";
        if (isPublic) {
            const creator = await User.findById(int.createdBy).select("name company").lean() as any;
            recruiterName = creator?.name || "Recruiter";
        }

        // Count actual questions per round from Question collection
        const Question = (await import("@/lib/models/Question")).default;
        const allQuestions = await Question.find({ interviewId: int._id }).select("roundId type").lean();
        const questionCountByRound: Record<string, number> = {};
        const questionCountByType: Record<string, number> = {};
        allQuestions.forEach((q: any) => {
            const rid = q.roundId?.toString() || "";
            questionCountByRound[rid] = (questionCountByRound[rid] || 0) + 1;
            const qtype = q.type || "";
            questionCountByType[qtype] = (questionCountByType[qtype] || 0) + 1;
        });
        const hasQuestionDocs = allQuestions.length > 0;

        const interview = {
            id: int._id.toString(),
            title: int.title,
            role: int.role,
            company: recruiterName || "",
            description: int.description,
            rounds: (int.rounds || []).map((r: any) => {
                const roundId = r._id?.toString() || r.id;
                // Try matching by roundId first, then by type (for broken roundId data), then stored value
                const dynamicCount = questionCountByRound[roundId];
                const typeCount = questionCountByType[r.type];
                let finalCount: number;
                if (dynamicCount !== undefined && dynamicCount > 0) {
                    finalCount = dynamicCount;
                } else if (hasQuestionDocs && typeCount !== undefined && typeCount > 0) {
                    finalCount = typeCount;
                } else {
                    finalCount = r.questionCount;
                }
                return {
                    id: roundId,
                    type: r.type,
                    title: r.title,
                    duration: r.duration,
                    difficulty: r.difficulty,
                    questionCount: finalCount,
                    techStack: r.techStack || [],
                    isRequired: r.isRequired,
                    order: r.order,
                };
            }),
            status: int.status,
            createdBy: int.createdBy.toString(),
            deadline: int.deadline || null,
            applicants: int.applicants || 0,
            passingScore: int.passingScore,
            techStack: int.techStack || [],
            difficulty: int.difficulty,
            antiCheat: int.antiCheat,
            createdAt: int.createdAt,
            recruiterName,
        };

        return NextResponse.json({ interview }, { status: 200 });
    } catch (error: any) {
        // Handle invalid ObjectId format
        if (error.name === "CastError" || error.kind === "ObjectId") {
            return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
        }
        console.error("Fetch interview detail error:", error);
        return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 });
    }
}

// ─── PATCH /api/interviews/[id] — Update an existing interview ──────
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
        }

        const body = await request.json();

        await dbConnect();

        // Verify ownership
        const existing = await Interview.findOne({ _id: id, createdBy: userId });
        if (!existing) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Build update object — only update fields that are provided
        const update: any = {};

        if (body.title !== undefined) update.title = body.title.trim();
        if (body.role !== undefined) update.role = body.role.trim();
        if (body.description !== undefined) update.description = body.description;
        if (body.status !== undefined) update.status = body.status;
        if (body.difficulty !== undefined) update.difficulty = body.difficulty;
        if (body.passingScore !== undefined) update.passingScore = body.passingScore;
        if (body.antiCheat !== undefined) update.antiCheat = body.antiCheat;
        if (body.techStack !== undefined) update.techStack = body.techStack;
        if (body.deadline !== undefined) {
            update.deadline = body.deadline ? new Date(body.deadline) : null;
        }

        // Handle rounds — replace entire rounds array if provided
        if (body.rounds !== undefined && Array.isArray(body.rounds)) {
            update.rounds = body.rounds.map((r: any, i: number) => ({
                type: r.type,
                title: r.title || `Round ${i + 1}`,
                duration: r.duration || 30,
                difficulty: r.difficulty || "Medium",
                questionCount: r.questionCount || 10,
                techStack: r.techStack || [],
                isRequired: r.isRequired !== false,
                order: r.order || i + 1,
            }));
        }

        const updated = await Interview.findByIdAndUpdate(id, update, { new: true }).lean();

        return NextResponse.json({
            message: "Interview updated successfully",
            interview: {
                id: (updated as any)._id.toString(),
                title: (updated as any).title,
                role: (updated as any).role,
                rounds: ((updated as any).rounds || []).length,
                status: (updated as any).status,
            },
        }, { status: 200 });
    } catch (error: any) {
        if (error.name === "CastError" || error.kind === "ObjectId") {
            return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
        }
        console.error("Update interview error:", error);
        return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
    }
}

// ─── DELETE /api/interviews/[id] — Delete an interview permanently ───
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
        }

        await dbConnect();

        // Verify ownership before deleting
        const existing = await Interview.findOne({ _id: id, createdBy: userId });
        if (!existing) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        await Interview.findByIdAndDelete(id);

        // Decrement recruiter's totalInterviews counter
        await User.findByIdAndUpdate(userId, {
            $inc: { totalInterviews: -1 },
        });

        return NextResponse.json(
            { message: "Interview deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        if (error.name === "CastError" || error.kind === "ObjectId") {
            return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
        }
        console.error("Delete interview error:", error);
        return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 });
    }
}
