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

// ─── POST /api/interviews — Create a new interview ──────────────────
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      role,
      description,
      rounds,
      difficulty,
      deadline,
      passingScore,
      techStack,
      antiCheat,
    } = body;

    // ── Validate required fields ──────────────────────────────────────
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Interview title is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // ── Create interview ──────────────────────────────────────────────
    const interview = await Interview.create({
      title: title.trim(),
      role: role?.trim() || "",
      description: description || "",
      rounds: Array.isArray(rounds)
        ? rounds.map((r: any, i: number) => ({
            type: r.type,
            title: r.title || `Round ${i + 1}`,
            duration: r.duration || 30,
            difficulty: r.difficulty || "Medium",
            questionCount: r.questionCount || 10,
            techStack: r.techStack || [],
            isRequired: r.isRequired !== false,
            order: r.order || i + 1,
          }))
        : [],
      status: "active",
      createdBy: userId,
      deadline: deadline ? new Date(deadline) : undefined,
      passingScore: passingScore || 70,
      techStack: techStack || [],
      difficulty: difficulty || "Medium",
      antiCheat: antiCheat !== false,
    });

    // ── Increment recruiter's totalInterviews counter ─────────────────
    await User.findByIdAndUpdate(userId, {
      $inc: { totalInterviews: 1 },
    });

    return NextResponse.json(
      {
        message: "Interview created successfully",
        interview: {
          id: interview._id,
          title: interview.title,
          role: interview.role,
          status: interview.status,
          rounds: interview.rounds.length,
          createdAt: interview.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create interview error:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}

// ─── GET /api/interviews — List interviews ──────────────────────────
// ?public=true → returns all active interviews (for students, no auth required)
// Default      → returns interviews for the logged-in recruiter (auth required)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const isPublic = url.searchParams.get("public") === "true";

    await dbConnect();

    if (isPublic) {
      // ── Public listing for students — all active interviews ──────
      const interviews = await Interview.find({ status: "active" })
        .sort({ createdAt: -1 })
        .lean();

      // Collect unique creator IDs to fetch recruiter names
      const creatorIds = Array.from(new Set(interviews.map((int: any) => int.createdBy.toString())));
      const creators = await User.find({ _id: { $in: creatorIds } }).select("name company").lean();
      const creatorMap: Record<string, { name: string; company: string }> = {};
      creators.forEach((c: any) => {
        creatorMap[c._id.toString()] = { name: c.name || "Recruiter", company: c.company || "" };
      });

      const mapped = interviews.map((int: any) => {
        const creator = creatorMap[int.createdBy.toString()] || { name: "Recruiter", company: "" };
        return {
          id: int._id.toString(),
          title: int.title,
          role: int.role,
          company: creator.company || creator.name,
          description: int.description,
          rounds: (int.rounds || []).map((r: any) => ({
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
          status: int.status,
          deadline: int.deadline || null,
          applicants: int.applicants || 0,
          passingScore: int.passingScore,
          techStack: int.techStack || [],
          difficulty: int.difficulty,
          antiCheat: int.antiCheat,
          createdAt: int.createdAt,
          recruiterName: creator.name,
        };
      });

      return NextResponse.json({ interviews: mapped }, { status: 200 });
    }

    // ── Recruiter's own interviews (auth required) ─────────────────
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const interviews = await Interview.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Map _id → id for frontend compatibility
    const mapped = interviews.map((int: any) => ({
      id: int._id.toString(),
      title: int.title,
      role: int.role,
      company: "", // will be populated from user profile if needed
      description: int.description,
      rounds: (int.rounds || []).map((r: any) => ({
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
      status: int.status,
      createdBy: int.createdBy.toString(),
      deadline: int.deadline || null,
      applicants: int.applicants || 0,
      passingScore: int.passingScore,
      techStack: int.techStack || [],
      difficulty: int.difficulty,
      antiCheat: int.antiCheat,
      createdAt: int.createdAt,
    }));

    return NextResponse.json({ interviews: mapped }, { status: 200 });
  } catch (error) {
    console.error("Fetch interviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

