"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, lazy, Suspense, memo } from "react";
import {
    BarChart3, Users, CheckCircle, Clock, TrendingUp, Plus,
    ArrowRight, Brain, Target, ChevronRight, Zap, MoreVertical,
    Building2, Calendar, Star
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from "recharts";

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

// ─── Zero-state analytics ─────────────────────────────────────────
const EMPTY_ANALYTICS = {
    totalApplicants: 0,
    completionRate: 0,
    averageScore: 0,
    passRate: 0,
    topTechStacks: [] as { name: string; count: number }[],
    scoreDistribution: [
        { range: "0-20", count: 0 }, { range: "20-40", count: 0 },
        { range: "40-60", count: 0 }, { range: "60-80", count: 0 },
        { range: "80-100", count: 0 },
    ],
    weeklyApplications: [
        { day: "Mon", count: 0 }, { day: "Tue", count: 0 }, { day: "Wed", count: 0 },
        { day: "Thu", count: 0 }, { day: "Fri", count: 0 }, { day: "Sat", count: 0 },
        { day: "Sun", count: 0 },
    ],
};

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

    useEffect(() => {
        let cancelled = false;
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setUserName(data.user.name);
                }
            } catch {
                const storedName = localStorage.getItem("userName");
                if (!cancelled && storedName) setUserName(storedName);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        fetchUser();
        return () => { cancelled = true; };
    }, []);

    // Use zero-state analytics for now — real data comes from future analytics API
    const analytics = EMPTY_ANALYTICS;

    const statCards = useMemo(() => [
        { label: "Total Applicants", value: analytics.totalApplicants > 0 ? analytics.totalApplicants.toLocaleString() : "—", change: "", icon: Users, color: "cyan", trend: "up" },
        { label: "Completion Rate", value: analytics.completionRate > 0 ? `${analytics.completionRate}%` : "—", change: "", icon: CheckCircle, color: "green", trend: "up" },
        { label: "Average Score", value: analytics.averageScore > 0 ? `${analytics.averageScore}%` : "—", change: "", icon: Target, color: "purple", trend: "up" },
        { label: "Pass Rate", value: analytics.passRate > 0 ? `${analytics.passRate}%` : "—", change: "", icon: TrendingUp, color: "orange", trend: "up" },
    ], [analytics]);

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
                                            {stat.change && (
                                                <Badge variant={stat.trend === "up" ? "green" : "red"} size="sm">
                                                    {stat.change}
                                                </Badge>
                                            )}
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
                                <div className="h-[180px] flex items-center justify-center text-text-muted text-sm">
                                    <div className="text-center">
                                        <p className="mb-1">No application data yet</p>
                                        <p className="text-xs text-text-muted/60">Create your first interview to start tracking applications</p>
                                    </div>
                                </div>
                            </div>

                            {/* Score Distribution */}
                            <div className="glass rounded-2xl border border-white/8 p-6">
                                <h2 className="font-semibold text-text-primary mb-1">Score Distribution</h2>
                                <p className="text-xs text-text-muted mb-5">All-time results</p>
                                <div className="h-[180px] flex items-center justify-center text-text-muted text-sm">
                                    <p className="text-xs text-text-muted/60">Scores will appear after candidates complete interviews</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Active Interviews — empty state */}
                            <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-semibold text-text-primary">Active Interviews</h2>
                                    <Link href="/recruiter/interviews" className="text-xs text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1 transition-colors">
                                        View all <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="text-center py-12 text-text-muted">
                                    <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No interviews yet</p>
                                    <Link href="/recruiter/interviews/create">
                                        <Button variant="primary" size="sm" className="mt-4" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                                            Create your first interview
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Top Tech Stacks — empty state */}
                            <div className="glass rounded-2xl border border-white/8 p-6">
                                <h2 className="font-semibold text-text-primary mb-5">Top Tech Stacks</h2>
                                <div className="text-center py-8 text-text-muted">
                                    <p className="text-xs text-text-muted/60">Tech stack data will appear after candidates apply</p>
                                </div>

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
