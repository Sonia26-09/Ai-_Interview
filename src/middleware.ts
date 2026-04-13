import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isStudentRoute = pathname.startsWith("/student");
    const isRecruiterRoute = pathname.startsWith("/recruiter");

    if (isStudentRoute || isRecruiterRoute) {
        const token = request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }

        try {
            const { payload } = await jwtVerify(token, encodedSecret);
            const userRole = payload.role as string;

            // Role-based authorization
            if (isStudentRoute && userRole !== "student") {
                return NextResponse.redirect(new URL("/auth/login?role=student", request.url));
            }
            if (isRecruiterRoute && userRole !== "recruiter") {
                return NextResponse.redirect(new URL("/auth/login?role=recruiter", request.url));
            }

            return NextResponse.next();
        } catch (error) {
            // Invalid or expired token
            console.error("JWT Verification failed:", error);
            const response = NextResponse.redirect(new URL("/auth/login", request.url));
            response.cookies.delete("auth-token");
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/student/:path*", "/recruiter/:path*"],
};
