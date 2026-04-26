"use client";

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import {
    Zap, Flame, Target, TrendingUp, Award, BarChart3, Star,
    Brain, Play, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
    Minus, Trophy, BookOpen, Sparkles, ChevronRight, Calendar,
    Code2, Mic, ClipboardList
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
    loadFromStorage,
    STORAGE_KEYS,
    generateFullReport,
} from "@/lib/ai-feedback";
import type { AptitudeResult, CodingResult, HRResult, AIFeedback } from "@/lib/types";

// Lazy load recharts
const LazyProgressCharts = lazy(() => import("./ProgressCharts"));

// ─── Types ──────────────────────────────────────────────────────
interface UserData {
    name: string;
    xp: number;
    level: number;
    streak: number;
    totalAttempts: number;
    averageScore: number;
    badges: { id: string; name: string; description: string; icon: string; color: string; earnedAt: string }[];
    createdAt?: string;
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

// ─── Skeleton ───────────────────────────────────────────────────
function ProgressSkeleton() {
    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="..." />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-56 bg-white/5 rounded-lg" />
                    <div className="h-4 w-72 bg-white/5 rounded-lg" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/8" />
                        ))}
                    </div>
                    <div className="h-72 bg-white/5 rounded-2xl border border-white/8" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="h-64 bg-white/5 rounded-2xl border border-white/8" />
                        <div className="h-64 bg-white/5 rounded-2xl border border-white/8" />
                    </div>
                </div>
            </main>
        </div>
    );
}

function ChartFallback() {
    return (
        <div className="glass rounded-2xl border border-white/8 p-6 h-[280px] flex items-center justify-center">
            <div className="text-text-muted text-sm animate-pulse">Loading charts...</div>
        </div>
    );
}

// ─── Trend Icon ─────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
    if (trend === "up") return <ArrowUpRight className="w-3.5 h-3.5 text-neon-green" />;
    if (trend === "down") return <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-text-muted" />;
}

// ─── Main Page ──────────────────────────────────────────────────
export default function StudentProgressPage() {
    const [user, setUser] = useState<UserData>(DEFAULT_USER);
    const [isLoading, setIsLoading] = useState(true);
    const [report, setReport] = useState<AIFeedback | null>(null);
    const [aptitude, setAptitude] = useState<AptitudeResult | null>(null);
    const [coding, setCoding] = useState<CodingResult | null>(null);
    const [hr, setHr] = useState<HRResult | null>(null);

    // Fetch real user data from API, THEN load localStorage only if it belongs to this user
    useEffect(() => {
        let cancelled = false;
        async function fetchAndLoad() {
            let dbUser = DEFAULT_USER;
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) {
                        dbUser = data.user;
                        setUser(data.user);
                    }
                }
            } catch {
                const storedName = localStorage.getItem("userName");
                if (!cancelled && storedName) {
                    dbUser = { ...DEFAULT_USER, name: storedName };
                    setUser(dbUser);
                }
            }

            // Only load localStorage interview data if:
            // 1. User has DB attempts (they've completed interviews on this account), OR
            // 2. There's a fresh session flag (just finished an interview right now)
            const hasFreshSession = sessionStorage.getItem("aimock_stats_saved_session");
            const userHasAttempts = (dbUser.totalAttempts ?? 0) > 0;

            if (!cancelled && (userHasAttempts || hasFreshSession)) {
                const apt = loadFromStorage<AptitudeResult>(STORAGE_KEYS.aptitude);
                const cod = loadFromStorage<CodingResult>(STORAGE_KEYS.coding);
                const hrRes = loadFromStorage<HRResult>(STORAGE_KEYS.hr);
                setAptitude(apt);
                setCoding(cod);
                setHr(hrRes);
                if (apt || cod || hrRes) {
                    setReport(generateFullReport(apt, cod, hrRes));
                }
            }

            if (!cancelled) setIsLoading(false);
        }
        fetchAndLoad();
        return () => { cancelled = true; };
    }, []);

    // Computed values
    const hasInterviewData = !!(aptitude || coding || hr);
    const hasAnyData = hasInterviewData || user.totalAttempts > 0 || user.averageScore > 0;

    const xpToNext = useMemo(() => Math.max(0, (user.level * 1000) - user.xp), [user.xp, user.level]);
    const xpPercent = useMemo(() => {
        const target = user.level * 1000;
        return target > 0 ? Math.min(100, (user.xp / target) * 100) : 0;
    }, [user.xp, user.level]);

    const aptitudeScore = useMemo(() => {
        if (!aptitude) return 0;
        return Math.round((aptitude.score / Math.max(aptitude.totalPoints, 1)) * 100);
    }, [aptitude]);

    const codingScore = coding?.overallScore ?? 0;
    const hrScore = hr?.overallScore ?? 0;

    const roundScores = useMemo(() => [
        { name: "Aptitude", score: aptitudeScore, icon: ClipboardList, color: "blue", available: !!aptitude },
        { name: "Coding", score: codingScore, icon: Code2, color: "cyan", available: !!coding },
        { name: "HR", score: hrScore, icon: Mic, color: "purple", available: !!hr },
    ], [aptitudeScore, codingScore, hrScore, aptitude, coding, hr]);

    const levelTitle = user.level >= 10 ? "Code Wizard" : user.level >= 5 ? "Code Explorer" : "Beginner";

    if (isLoading) return <ProgressSkeleton />;

    const firstName = user.name.split(" ")[0];

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName={user.name} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ── Header ── */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-neon-cyan" />
                                Your Progress
                            </h1>
                            <p className="text-text-secondary text-sm mt-1">
                                {hasAnyData
                                    ? `Track your growth across all interview rounds, ${firstName}`
                                    : `Start practicing to see your progress here, ${firstName}!`
                                }
                            </p>
                        </div>
                        <Link href="/student/practice">
                            <Button variant="primary" size="md" leftIcon={<Play className="w-4 h-4" />}>
                                Practice Now
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Level & XP Card ── */}
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
                                <div className="text-sm text-text-muted">Level {user.level} • {levelTitle}</div>
                                <div className="text-xl font-bold font-display gradient-text-cyan">{user.xp.toLocaleString()} XP</div>
                                <div className="text-xs text-text-muted">{xpToNext.toLocaleString()} XP to Level {user.level + 1}</div>
                            </div>
                        </div>
                        <div className="flex-1 sm:max-w-sm">
                            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan rounded-full transition-all duration-700 ease-out"
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

                {/* ── Quick Stats ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Avg. Score", value: user.averageScore > 0 ? `${user.averageScore}%` : "—", icon: BarChart3, color: "cyan", sub: "across all rounds" },
                        { label: "Total Attempts", value: user.totalAttempts || "—", icon: Target, color: "purple", sub: "interviews taken" },
                        { label: "Current Streak", value: user.streak > 0 ? `${user.streak} days` : "—", icon: Flame, color: "orange", sub: "keep it going!" },
                        { label: "Badges Earned", value: user.badges.length > 0 ? user.badges.length : "—", icon: Award, color: "green", sub: "achievements unlocked" },
                    ].map((s) => {
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

                {/* ── Round-wise Breakdown ── */}
                <div className="glass rounded-2xl border border-white/8 p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-semibold text-text-primary flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-neon-cyan" />
                                Round-wise Performance
                            </h2>
                            <p className="text-xs text-text-muted mt-0.5">
                                {hasInterviewData ? "Your latest interview scores by round" : "Complete an interview to see round-wise breakdown"}
                            </p>
                        </div>
                        {hasInterviewData && report && (
                            <Badge variant={report.overallScore >= 70 ? "green" : report.overallScore >= 50 ? "yellow" : "red"}>
                                Overall: {report.overallScore}%
                            </Badge>
                        )}
                    </div>

                    {hasInterviewData ? (
                        <div className="space-y-4">
                            {roundScores.map((round) => {
                                const Icon = round.icon;
                                return (
                                    <div key={round.name} className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-neon-${round.color}/10 border border-neon-${round.color}/20 flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-5 h-5 text-neon-${round.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm font-medium text-text-primary">{round.name}</span>
                                                <span className={`text-sm font-bold ${round.available ? (round.score >= 70 ? "text-neon-green" : round.score >= 50 ? "text-yellow-400" : "text-red-400") : "text-text-muted"}`}>
                                                    {round.available ? `${round.score}%` : "Not taken"}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${round.score >= 70 ? "bg-neon-green" : round.score >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                                                    style={{ width: round.available ? `${round.score}%` : "0%" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-text-muted text-sm">
                            <ClipboardList className="w-8 h-8 mb-2 opacity-30" />
                            <p>No interview data yet</p>
                            <p className="text-xs text-text-muted/60 mt-1">Complete a practice interview to see your scores</p>
                        </div>
                    )}
                </div>

                {/* ── Charts (lazy loaded) ── */}
                {hasInterviewData && report && (
                    <Suspense fallback={<ChartFallback />}>
                        <LazyProgressCharts report={report} aptitudeScore={aptitudeScore} codingScore={codingScore} hrScore={hrScore} />
                    </Suspense>
                )}

                {/* ── AI Insights & Study Plan ── */}
                {hasInterviewData && report && (
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Strengths & Weaknesses */}
                        <div className="glass rounded-2xl border border-neon-purple/20 p-6 bg-neon-purple/5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                                    <Brain className="w-4 h-4 text-background" />
                                </div>
                                <h2 className="font-semibold text-text-primary">AI Insights</h2>
                                <Badge variant="purple" size="sm">AI Generated</Badge>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-2">💪 Strengths</h3>
                                    <ul className="space-y-1.5">
                                        {report.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">⚡ Areas to Improve</h3>
                                    <ul className="space-y-1.5">
                                        {report.improvements.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                                <TrendingUp className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/8">
                                <Badge variant={report.recommendation === "Strongly Recommend" ? "green" : report.recommendation === "Recommend" ? "cyan" : report.recommendation === "Maybe" ? "yellow" : "red"} className="text-xs">
                                    <Sparkles className="w-3 h-3" />
                                    AI Verdict: {report.recommendation}
                                </Badge>
                            </div>
                        </div>

                        {/* Study Plan */}
                        <div className="glass rounded-2xl border border-neon-cyan/20 p-6 bg-neon-cyan/3">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-background" />
                                </div>
                                <h2 className="font-semibold text-text-primary">📚 Study Plan</h2>
                                <Badge variant="cyan" size="sm">Personalised</Badge>
                            </div>
                            <p className="text-xs text-text-muted mb-4">Your custom action plan based on interview performance:</p>
                            <div className="space-y-3">
                                {report.studyPlan.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 glass rounded-xl border border-white/8">
                                        <div className="w-6 h-6 rounded-full bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-neon-cyan">{i + 1}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Badges Showcase ── */}
                <div className="glass rounded-2xl border border-white/8 p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-semibold text-text-primary flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                Badges & Achievements
                            </h2>
                            <p className="text-xs text-text-muted mt-0.5">
                                {user.badges.length > 0 ? `You've earned ${user.badges.length} badge(s) — keep going!` : "Complete milestones to earn badges"}
                            </p>
                        </div>
                    </div>

                    {user.badges.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {user.badges.map((badge) => (
                                <div key={badge.id} className={`p-4 rounded-xl bg-neon-${badge.color || "cyan"}/5 border border-neon-${badge.color || "cyan"}/20 hover:border-neon-${badge.color || "cyan"}/40 transition-all hover:scale-[1.02] group cursor-default`}>
                                    <div className="text-2xl mb-2">{badge.icon}</div>
                                    <div className="text-sm font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">{badge.name}</div>
                                    <div className="text-xs text-text-muted mt-0.5">{badge.description}</div>
                                    {badge.earnedAt && (
                                        <div className="text-xs text-text-muted/60 mt-2 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(badge.earnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-text-muted text-sm">
                            <Award className="w-8 h-8 mb-2 opacity-30" />
                            <p>No badges earned yet</p>
                            <p className="text-xs text-text-muted/60 mt-1">Complete interviews and maintain streaks to unlock badges</p>
                        </div>
                    )}
                </div>

                {/* ── Empty State CTA ── */}
                {!hasAnyData && (
                    <div className="glass rounded-2xl border border-neon-cyan/20 p-10 text-center bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-white/10 flex items-center justify-center mx-auto mb-5">
                            <TrendingUp className="w-8 h-8 text-neon-cyan" />
                        </div>
                        <h2 className="text-xl font-bold font-display mb-2">Start Your Journey</h2>
                        <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
                            Complete your first mock interview to unlock detailed progress tracking, AI-powered insights, personalized study plans, and badge rewards.
                        </p>
                        <Link href="/student/practice">
                            <Button variant="primary" size="lg" leftIcon={<Play className="w-4 h-4" />}>
                                Take Your First Interview
                            </Button>
                        </Link>
                    </div>
                )}

                {/* ── Quick Links ── */}
                <div className="grid sm:grid-cols-3 gap-3 mt-6">
                    {[
                        { href: "/student/dashboard", label: "Dashboard", desc: "Overview & stats", icon: BarChart3, color: "cyan" },
                        { href: "/student/practice", label: "Practice", desc: "Start a mock interview", icon: Play, color: "purple" },
                        { href: "/student/leaderboard", label: "Leaderboard", desc: "See your rank", icon: Trophy, color: "green" },
                    ].map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link key={link.href} href={link.href}>
                                <div className="glass rounded-xl border border-white/8 p-4 hover:border-white/15 hover:bg-white/3 transition-all group cursor-pointer flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg bg-neon-${link.color}/10 border border-neon-${link.color}/20 flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 text-neon-${link.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">{link.label}</div>
                                        <div className="text-xs text-text-muted">{link.desc}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-neon-cyan transition-colors" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
