import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Interview from "@/lib/models/Interview";

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
export async function GET(
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

        const int = await Interview.findOne({ _id: id, createdBy: userId }).lean();

        if (!int) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const interview = {
            id: (int as any)._id.toString(),
            title: (int as any).title,
            role: (int as any).role,
            company: "",
            description: (int as any).description,
            rounds: ((int as any).rounds || []).map((r: any) => ({
                id: r._id?.toString() || r.id,
                type: r.type,
                title: r.title,
                duration: r.duration,
                difficulty: r.difficulty,
                questionCount: r.questionCount,
                techStack: r.techStack || [],
                isRequired: r.isRequired,
                order: r.order,
            })),
            status: (int as any).status,
            createdBy: (int as any).createdBy.toString(),
            deadline: (int as any).deadline || null,
            applicants: (int as any).applicants || 0,
            passingScore: (int as any).passingScore,
            techStack: (int as any).techStack || [],
            difficulty: (int as any).difficulty,
            antiCheat: (int as any).antiCheat,
            createdAt: (int as any).createdAt,
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
