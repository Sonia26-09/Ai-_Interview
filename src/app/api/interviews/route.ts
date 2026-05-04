import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Interview from "@/lib/models/Interview";
import Question from "@/lib/models/Question";
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
      questions: rawQuestions,
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

    // ── Build rounds array ────────────────────────────────────────────
    const roundsArray = Array.isArray(rounds)
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
      : [];

    // ── Create interview ──────────────────────────────────────────────
    const interview = await Interview.create({
      title: title.trim(),
      role: role?.trim() || "",
      description: description || "",
      rounds: roundsArray,
      status: "active",
      createdBy: userId,
      deadline: deadline ? new Date(deadline) : undefined,
      passingScore: passingScore || 70,
      techStack: techStack || [],
      difficulty: difficulty || "Medium",
      antiCheat: antiCheat !== false,
    });

    // ── Save recruiter-authored questions ──────────────────────────────
    if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
      // Map round frontendId → actual MongoDB _id
      const roundIdMap: Record<string, string> = {};
      (rounds || []).forEach((r: any, i: number) => {
        const savedRound = interview.rounds[i];
        if (savedRound && r.frontendId) {
          roundIdMap[r.frontendId] = (savedRound as any)._id.toString();
        }
      });

      const questionDocs = rawQuestions.map((q: any, idx: number) => {
        // Resolve roundId: use the map if available, otherwise use raw roundId
        const resolvedRoundId = roundIdMap[q.roundId] || q.roundId || "";

        const base: any = {
          interviewId: interview._id,
          roundId: resolvedRoundId,
          type: q.type,
          title: q.title || `Question ${idx + 1}`,
          description: q.description || "",
          difficulty: q.difficulty || "Medium",
          tags: q.tags || [],
          points: q.points || (q.type === "coding" ? 100 : 10),
          order: q.order ?? idx,
          isAIGenerated: false,
        };

        if (q.type === "aptitude") {
          base.options = q.options || [];
          base.correctOption = q.correctOption ?? 0;
        }

        if (q.type === "coding") {
          base.starterCode = q.starterCode || {};
          base.functionName = q.functionName || "";
          base.testCases = (q.testCases || []).map((tc: any) => ({
            input: tc.input || "",
            expectedOutput: tc.expectedOutput || "",
            isHidden: tc.isHidden || false,
            description: tc.description || "",
          }));
          base.aiHints = q.aiHints || [];
        }

        return base;
      });

      await Question.insertMany(questionDocs);

      // Update questionCount on each round based on actual questions saved
      for (let i = 0; i < interview.rounds.length; i++) {
        const round = interview.rounds[i];
        const roundMongoId = (round as any)._id.toString();
        const count = questionDocs.filter(
          (q: any) => q.roundId === roundMongoId
        ).length;
        round.questionCount = count;
      }
      await interview.save();
    }

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

      // Bulk-fetch question counts for all interviews
      const interviewIds = interviews.map((int: any) => int._id);
      const allQuestions = await Question.find({ interviewId: { $in: interviewIds } })
        .select("interviewId roundId type")
        .lean();

      // Build maps: interviewId → roundId → count, interviewId → type → count
      const qCountMap: Record<string, Record<string, number>> = {};
      const qTypeMap: Record<string, Record<string, number>> = {};
      const qTotalMap: Record<string, number> = {};
      allQuestions.forEach((q: any) => {
        const iid = q.interviewId?.toString() || "";
        const rid = q.roundId?.toString() || "";
        const qtype = q.type || "";
        if (!qCountMap[iid]) qCountMap[iid] = {};
        qCountMap[iid][rid] = (qCountMap[iid][rid] || 0) + 1;
        if (!qTypeMap[iid]) qTypeMap[iid] = {};
        qTypeMap[iid][qtype] = (qTypeMap[iid][qtype] || 0) + 1;
        qTotalMap[iid] = (qTotalMap[iid] || 0) + 1;
      });

      const mapped = interviews.map((int: any) => {
        const creator = creatorMap[int.createdBy.toString()] || { name: "Recruiter", company: "" };
        const iid = int._id.toString();
        const hasQDocs = (qTotalMap[iid] || 0) > 0;
        return {
          id: iid,
          title: int.title,
          role: int.role,
          company: creator.company || creator.name,
          description: int.description,
          rounds: (int.rounds || []).map((r: any) => {
            const rid = r._id?.toString() || r.id;
            const dynamicCount = qCountMap[iid]?.[rid];
            const typeCount = qTypeMap[iid]?.[r.type];
            let finalCount: number;
            if (dynamicCount !== undefined && dynamicCount > 0) {
              finalCount = dynamicCount;
            } else if (hasQDocs && typeCount !== undefined && typeCount > 0) {
              finalCount = typeCount;
            } else {
              finalCount = r.questionCount;
            }
            return {
              id: rid,
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

    // Bulk-fetch question counts for recruiter's interviews
    const recruiterInterviewIds = interviews.map((int: any) => int._id);
    const recruiterQuestions = await Question.find({ interviewId: { $in: recruiterInterviewIds } })
      .select("interviewId roundId type")
      .lean();

    const rqCountMap: Record<string, Record<string, number>> = {};
    const rqTypeMap: Record<string, Record<string, number>> = {};
    const rqTotalMap: Record<string, number> = {};
    recruiterQuestions.forEach((q: any) => {
      const iid = q.interviewId?.toString() || "";
      const rid = q.roundId?.toString() || "";
      const qtype = q.type || "";
      if (!rqCountMap[iid]) rqCountMap[iid] = {};
      rqCountMap[iid][rid] = (rqCountMap[iid][rid] || 0) + 1;
      if (!rqTypeMap[iid]) rqTypeMap[iid] = {};
      rqTypeMap[iid][qtype] = (rqTypeMap[iid][qtype] || 0) + 1;
      rqTotalMap[iid] = (rqTotalMap[iid] || 0) + 1;
    });

    // Map _id → id for frontend compatibility
    const mapped = interviews.map((int: any) => {
      const iid = int._id.toString();
      const hasQDocs = (rqTotalMap[iid] || 0) > 0;
      return {
        id: iid,
        title: int.title,
        role: int.role,
        company: "", // will be populated from user profile if needed
        description: int.description,
        rounds: (int.rounds || []).map((r: any) => {
          const rid = r._id?.toString() || r.id;
          const dynamicCount = rqCountMap[iid]?.[rid];
          const typeCount = rqTypeMap[iid]?.[r.type];
          let finalCount: number;
          if (dynamicCount !== undefined && dynamicCount > 0) {
            finalCount = dynamicCount;
          } else if (hasQDocs && typeCount !== undefined && typeCount > 0) {
            finalCount = typeCount;
          } else {
            finalCount = r.questionCount;
          }
          return {
            id: rid,
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
      };
    });

    return NextResponse.json({ interviews: mapped }, { status: 200 });
  } catch (error) {
    console.error("Fetch interviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

