import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
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

// ─── PATCH /api/profile — Update user profile ───────────────────────
export async function PATCH(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();

        await dbConnect();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only allow updating safe fields
        if (body.name !== undefined) user.name = body.name.trim();
        if (body.company !== undefined) user.company = body.company.trim();
        if (body.techStack !== undefined) user.techStack = body.techStack;

        await user.save();

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company,
                techStack: user.techStack || [],
                totalInterviews: user.totalInterviews,
                createdAt: user.createdAt,
            },
        }, { status: 200 });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
