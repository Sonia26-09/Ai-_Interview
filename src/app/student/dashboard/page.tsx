"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import {
    Zap, Flame, Target, TrendingUp, Clock, Award, BookOpen,
    ChevronRight, Play, BarChart3, Star, Users, Calendar, Brain, Building2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { practiceTemplates } from "@/lib/mock-data";
import { cn, formatDuration } from "@/lib/utils";

// Lazy load heavy recharts components
const LazyCharts = lazy(() => import("@/components/dashboard/StudentCharts"));

// ─── Skeleton Loader ─────────────────────────────────────────────
function DashboardSkeleton() {
    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="..." />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    {/* Header skeleton */}
                    <div>
                        <div className="h-8 w-48 bg-white/5 rounded-lg mb-2" />
                        <div className="h-4 w-64 bg-white/5 rounded-lg" />
                    </div>
                    {/* XP Card skeleton */}
                    <div className="h-32 bg-white/5 rounded-2xl border border-white/8" />
                    {/* Stats grid skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/8" />
                        ))}
                    </div>
                    {/* Charts skeleton */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl border border-white/8" />
                        <div className="h-64 bg-white/5 rounded-2xl border border-white/8" />
                    </div>
                </div>
            </main>
        </div>
    );
}

// ─── Chart Loading Fallback ─────────────────────────────────────
function ChartSkeleton() {
    return (
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6 h-[240px] flex items-center justify-center">
                <div className="text-text-muted text-sm animate-pulse">Loading charts...</div>
            </div>
            <div className="glass rounded-2xl border border-white/8 p-6 h-[240px] flex items-center justify-center">
                <div className="text-text-muted text-sm animate-pulse">Loading radar...</div>
            </div>
        </div>
    );
}

// ─── User data type ─────────────────────────────────────────────
interface UserData {
    name: string;
    xp: number;
    level: number;
    streak: number;
    totalAttempts: number;
    averageScore: number;
    badges: { id: string; name: string; description: string; icon: string; color: string; earnedAt: string }[];
}

const DEFAULT_USER: UserData = {
    name: "Student",
    xp: 0,
    level: 1,
    streak: 0,
    totalAttempts: 0,
    averageScore: 0,
    badges: [],
};

interface DBInterview {
    id: string;
    title: string;
    role: string;
    company: string;
    description: string;
    rounds: { id: string; type: string; title: string; duration: number; questionCount: number }[];
    difficulty: string;
    techStack: string[];
    recruiterName: string;
}

export default function StudentDashboard() {
    const [user, setUser] = useState<UserData>(DEFAULT_USER);
    const [isLoading, setIsLoading] = useState(true);
    const [companyInterviews, setCompanyInterviews] = useState<DBInterview[]>([]);

    useEffect(() => {
        let cancelled = false;
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setUser(data.user);
                }
            } catch {
                // Fallback: use localStorage name if API fails
                const storedName = localStorage.getItem("userName");
                if (!cancelled && storedName) setUser(prev => ({ ...prev, name: storedName }));
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        fetchUser();

        // Fetch company interviews (public)
        async function fetchCompanyInterviews() {
            try {
                const res = await fetch("/api/interviews?public=true");
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setCompanyInterviews(data.interviews || []);
                }
            } catch { /* silent */ }
        }
        fetchCompanyInterviews();

        return () => { cancelled = true; };
    }, []);

    // Memoize computed values
    const xpToNext = useMemo(() => Math.max(0, (user.level * 1000) - user.xp), [user.xp, user.level]);
    const xpPercent = useMemo(() => {
        const target = user.level * 1000;
        return target > 0 ? Math.min(100, (user.xp / target) * 100) : 0;
    }, [user.xp, user.level]);

    const statCards = useMemo(() => [
        { label: "Avg. Score", value: user.averageScore > 0 ? `${user.averageScore}%` : "—", icon: BarChart3, color: "cyan", sub: "across all rounds" },
        { label: "Total Attempts", value: user.totalAttempts || "—", icon: Target, color: "purple", sub: "this month" },
        { label: "Best Streak", value: user.streak > 0 ? `${user.streak} days` : "—", icon: Flame, color: "orange", sub: "personal best" },
        { label: "Rank", value: "—", icon: Award, color: "green", sub: "global leaderboard" },
    ], [user.averageScore, user.totalAttempts, user.streak]);

    if (isLoading) return <DashboardSkeleton />;

    const firstName = user.name.split(" ")[0];

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName={user.name} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-8 w-full items-center sm:items-start text-center sm:text-left">
                    <div>
                        <h1 className="text-2xl font-bold font-display">
                            Hey, {firstName} 👋
                        </h1>
                        <p className="text-text-secondary text-sm mt-0.5 mb-4">
                            {user.streak > 0
                                ? `Keep going — you're on a ${user.streak}-day streak! 🔥`
                                : "Start practicing to build your streak! 🚀"}
                        </p>
                        <Link href="/student/practice" className="inline-block w-full sm:w-auto">
                            <Button variant="primary" size="md" className="w-full sm:w-auto min-w-[160px] justify-center" leftIcon={<Play className="w-4 h-4" />}>
                                Start Practice
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Level & XP Card */}
                <div className="glass rounded-2xl border border-neon-purple/20 p-6 mb-6 bg-gradient-to-r from-neon-purple/5 to-neon-cyan/5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center shadow-neon-purple">
                                    <span className="text-2xl font-bold text-background font-display">{user.level}</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-neon-purple flex items-center justify-center">
                                    <Star className="w-2.5 h-2.5 text-neon-purple fill-neon-purple" />
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-text-muted">Level {user.level} • {user.level >= 10 ? "Code Wizard" : user.level >= 5 ? "Code Explorer" : "Beginner"}</div>
                                <div className="text-xl font-bold font-display gradient-text-cyan">{user.xp.toLocaleString()} XP</div>
                                <div className="text-xs text-text-muted">{xpToNext.toLocaleString()} XP to Level {user.level + 1}</div>
                            </div>
                        </div>
                        <div className="flex-1 sm:max-w-xs">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan rounded-full transition-all duration-500"
                                    style={{ width: `${xpPercent}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-orange-400" />
                                    <span className="font-semibold text-orange-400">{user.streak}</span>
                                    <span className="text-text-muted text-xs">day streak</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-neon-green" />
                                    <span className="font-semibold text-neon-green">{user.totalAttempts}</span>
                                    <span className="text-text-muted text-xs">attempts</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-yellow-400" />
                                    <span className="font-semibold text-yellow-400">{user.badges.length}</span>
                                    <span className="text-text-muted text-xs">badges</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {statCards.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="glass rounded-2xl border border-white/8 p-4 stat-card hover:border-white/15 transition-all">
                                <div className={`w-8 h-8 rounded-lg bg-neon-${s.color}/10 border border-neon-${s.color}/20 flex items-center justify-center mb-3`}>
                                    <Icon className={`w-4 h-4 text-neon-${s.color}`} />
                                </div>
                                <div className="text-2xl font-bold font-display">{s.value}</div>
                                <div className="text-xs text-text-muted">{s.label}</div>
                                <div className="text-xs text-text-muted/60 mt-0.5">{s.sub}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Charts — lazy loaded */}
                <Suspense fallback={<ChartSkeleton />}>
                    <LazyCharts averageScore={user.averageScore} />
                </Suspense>

                {/* Recommended Practice — uses system templates (not user data) */}
                <div className="glass rounded-2xl border border-white/8 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-semibold text-text-primary">Recommended Practice</h2>
                            <p className="text-xs text-text-muted mt-0.5">AI-picked based on your weak areas</p>
                        </div>
                        <Link href="/student/practice" className="text-xs text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1 transition-colors">
                            All templates <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {practiceTemplates.slice(0, 3).map((template) => (
                            <Link key={template.id} href={`/interview/${template.id}`}>
                                <div className="p-4 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 hover:bg-white/5 transition-all group cursor-pointer">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge variant={template.color as any} size="sm">{template.difficulty}</Badge>
                                        <div className="flex items-center gap-1 text-xs text-text-muted">
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            {template.rating}
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-text-primary mb-1 group-hover:text-neon-cyan transition-colors">{template.title}</h3>
                                    <p className="text-xs text-text-muted mb-3 line-clamp-2">{template.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-text-muted">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{template.duration}m</span>
                                        <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{template.rounds} rounds</span>
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(template.attempts / 1000).toFixed(0)}K</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Available Company Interviews */}
                {companyInterviews.length > 0 && (
                    <div className="glass rounded-2xl border border-white/8 p-6 mt-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4.5 h-4.5 text-neon-cyan" />
                                <div>
                                    <h2 className="font-semibold text-text-primary">Company Interviews</h2>
                                    <p className="text-xs text-text-muted mt-0.5">Real interviews posted by recruiters</p>
                                </div>
                            </div>
                            <Link href="/student/practice" className="text-xs text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1 transition-colors">
                                View All <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {companyInterviews.slice(0, 3).map((interview) => {
                                const totalDuration = interview.rounds.reduce((a, r) => a + r.duration, 0);
                                const totalQ = interview.rounds.reduce((a, r) => a + r.questionCount, 0);
                                return (
                                    <Link key={interview.id} href={`/interview/${interview.id}`}>
                                        <div className="p-4 rounded-xl bg-white/3 border border-white/8 hover:border-neon-cyan/30 hover:bg-white/5 transition-all group cursor-pointer">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge variant={interview.difficulty === "Hard" ? "red" : interview.difficulty === "Medium" ? "yellow" : "green"} size="sm">
                                                    {interview.difficulty}
                                                </Badge>
                                                <span className="text-xs text-text-muted flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {interview.company || interview.recruiterName}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-sm text-text-primary mb-1 group-hover:text-neon-cyan transition-colors">{interview.title}</h3>
                                            <p className="text-xs text-text-muted mb-3 line-clamp-2">{interview.description}</p>
                                            <div className="flex items-center gap-3 text-xs text-text-muted">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(totalDuration)}</span>
                                                <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{interview.rounds.length} rounds</span>
                                                <span className="flex items-center gap-1"><Target className="w-3 h-3" />{totalQ} Q</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
