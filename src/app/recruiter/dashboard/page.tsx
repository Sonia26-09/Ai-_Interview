"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, memo } from "react";
import {
    BarChart3, Users, CheckCircle, Clock, TrendingUp, Plus,
    ArrowRight, Brain, Target, ChevronRight, Zap, MoreVertical,
    Building2, Calendar, Star, UserCheck, UserX
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

const SCORE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4"];

const CustomTooltip = memo(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass rounded-lg border border-white/10 px-3 py-2 text-xs">
                <p className="text-text-muted mb-1">{label}</p>
                <p className="font-semibold text-neon-cyan">{payload[0]?.value} applicants</p>
            </div>
        );
    }
    return null;
});
CustomTooltip.displayName = "CustomTooltip";

interface AnalyticsData {
    totalApplicants: number;
    totalInterviews: number;
    averageScore: number;
    passRate: number;
    selectedCount: number;
    rejectedCount: number;
    scoreDistribution: { range: string; count: number }[];
    weeklyApplications: { day: string; count: number }[];
    perInterview: {
        id: string; title: string; status: string; rounds: number;
        passingScore: number; totalApplicants: number; averageScore: number;
        selected: number; rejected: number; createdAt: string;
    }[];
    topTechStacks: { name: string; count: number }[];
}

function DashboardSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex justify-between">
                <div><div className="h-8 w-56 bg-white/5 rounded-lg mb-2" /><div className="h-4 w-72 bg-white/5 rounded-lg" /></div>
                <div className="h-10 w-40 bg-white/5 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/8" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl border border-white/8" />
                <div className="h-64 bg-white/5 rounded-2xl border border-white/8" />
            </div>
        </div>
    );
}

export default function RecruiterDashboard() {
    const [userName, setUserName] = useState("Recruiter");
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            try {
                const [meRes, analyticsRes] = await Promise.all([
                    fetch("/api/auth/me"),
                    fetch("/api/recruiter/analytics"),
                ]);
                if (meRes.ok) {
                    const data = await meRes.json();
                    if (!cancelled) setUserName(data.user.name);
                }
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    if (!cancelled) setAnalytics(data);
                }
            } catch {
                const storedName = localStorage.getItem("userName");
                if (!cancelled && storedName) setUserName(storedName);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    const hasData = analytics && analytics.totalApplicants > 0;
    const hasInterviews = analytics && analytics.totalInterviews > 0;
    const activeInterviews = analytics?.perInterview.filter(iv => iv.status === "active").slice(0, 4) || [];

    const statCards = useMemo(() => [
        {
            label: "Total Applicants",
            value: analytics?.totalApplicants ? analytics.totalApplicants.toLocaleString() : "—",
            icon: Users, color: "cyan",
        },
        {
            label: "Completion Rate",
            value: hasData ? `${analytics!.passRate}%` : "—",
            icon: CheckCircle, color: "green",
        },
        {
            label: "Average Score",
            value: analytics?.averageScore ? `${analytics.averageScore}%` : "—",
            icon: Target, color: "purple",
        },
        {
            label: "Pass Rate",
            value: hasData ? `${analytics!.passRate}%` : "—",
            icon: TrendingUp, color: "orange",
        },
    ], [analytics, hasData]);

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={userName} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? <DashboardSkeleton /> : (
                    <>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl font-bold font-display">Recruiter Dashboard</h1>
                                <p className="text-text-secondary text-sm mt-0.5">Welcome back, {userName.split(" ")[0]} 👋 Here's what's happening.</p>
                            </div>
                            <Link href="/recruiter/interviews/create">
                                <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                                    Create Interview
                                </Button>
                            </Link>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {statCards.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="glass rounded-2xl border border-white/8 p-4 stat-card hover:border-white/15 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`w-9 h-9 rounded-xl bg-neon-${stat.color}/10 border border-neon-${stat.color}/20 flex items-center justify-center`}>
                                                <Icon className={`w-4 h-4 text-neon-${stat.color}`} />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold font-display text-text-primary">{stat.value}</div>
                                        <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6 mb-6">
                            {/* Weekly Applications Chart */}
                            <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="font-semibold text-text-primary">Weekly Applications</h2>
                                        <p className="text-xs text-text-muted mt-0.5">New applicants this week</p>
                                    </div>
                                    <Badge variant="cyan">This Week</Badge>
                                </div>
                                {hasData ? (
                                    <ResponsiveContainer width="100%" height={180}>
                                        <AreaChart data={analytics!.weeklyApplications}>
                                            <defs>
                                                <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="count" stroke="#00f5ff" fill="url(#weeklyGrad)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[180px] flex items-center justify-center text-text-muted text-sm">
                                        <div className="text-center">
                                            <p className="mb-1">No application data yet</p>
                                            <p className="text-xs text-text-muted/60">Create your first interview to start tracking applications</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Score Distribution */}
                            <div className="glass rounded-2xl border border-white/8 p-6">
                                <h2 className="font-semibold text-text-primary mb-1">Score Distribution</h2>
                                <p className="text-xs text-text-muted mb-5">All-time results</p>
                                {hasData ? (
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={analytics!.scoreDistribution} barSize={28}>
                                            <XAxis dataKey="range" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                                labelStyle={{ color: "#e2e8f0" }}
                                                itemStyle={{ color: "#94a3b8" }}
                                            />
                                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                {analytics!.scoreDistribution.map((_, i) => (
                                                    <Cell key={i} fill={SCORE_COLORS[i]} fillOpacity={0.8} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[180px] flex items-center justify-center text-text-muted text-sm">
                                        <p className="text-xs text-text-muted/60">Scores will appear after candidates complete interviews</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Active Interviews */}
                            <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-semibold text-text-primary">Active Interviews</h2>
                                    <Link href="/recruiter/interviews" className="text-xs text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1 transition-colors">
                                        View all <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                {activeInterviews.length > 0 ? (
                                    <div className="space-y-3">
                                        {activeInterviews.map(iv => (
                                            <Link key={iv.id} href={`/recruiter/interviews/${iv.id}`} className="flex items-center gap-4 p-3 rounded-xl border border-white/8 hover:border-white/15 hover:bg-white/3 transition-all">
                                                <div className="w-9 h-9 rounded-lg bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center flex-shrink-0">
                                                    <Brain className="w-4 h-4 text-neon-purple" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-medium text-text-primary truncate">{iv.title}</span>
                                                        <Badge variant="green" size="sm" dot>Active</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-text-muted">
                                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{iv.totalApplicants} applicants</span>
                                                        <span className="flex items-center gap-1"><Target className="w-3 h-3" />{iv.averageScore > 0 ? `${iv.averageScore}%` : "—"} avg</span>
                                                        <span className="flex items-center gap-1 text-neon-green"><UserCheck className="w-3 h-3" />{iv.selected}</span>
                                                        <span className="flex items-center gap-1 text-red-400"><UserX className="w-3 h-3" />{iv.rejected}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-text-muted">
                                        <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No interviews yet</p>
                                        <Link href="/recruiter/interviews/create">
                                            <Button variant="primary" size="sm" className="mt-4" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                                                Create your first interview
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Top Tech Stacks & Quick Actions */}
                            <div className="glass rounded-2xl border border-white/8 p-6">
                                <h2 className="font-semibold text-text-primary mb-5">Top Tech Stacks</h2>
                                {analytics?.topTechStacks && analytics.topTechStacks.length > 0 ? (
                                    <div className="space-y-3">
                                        {analytics.topTechStacks.map((ts, i) => (
                                            <div key={ts.name} className="flex items-center gap-3">
                                                <span className="w-5 text-xs font-bold text-text-muted">{i + 1}.</span>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-text-primary font-medium">{ts.name}</span>
                                                        <span className="text-text-muted">{ts.count} interview{ts.count !== 1 ? "s" : ""}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all"
                                                            style={{ width: `${Math.min(100, (ts.count / Math.max(analytics.totalInterviews, 1)) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-text-muted">
                                        <p className="text-xs text-text-muted/60">Tech stack data will appear after candidates apply</p>
                                    </div>
                                )}

                                <div className="mt-6 pt-5 border-t border-white/8">
                                    <h3 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Quick Actions</h3>
                                    <div className="space-y-2">
                                        <Link href="/recruiter/interviews/create">
                                            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all text-left">
                                                <Plus className="w-4 h-4 text-neon-cyan" />New Interview
                                            </button>
                                        </Link>
                                        <Link href="/recruiter/analytics">
                                            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all text-left">
                                                <BarChart3 className="w-4 h-4 text-neon-purple" />View Analytics
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
