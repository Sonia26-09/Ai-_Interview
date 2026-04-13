"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
import { mockRecruiterAnalytics, mockInterviews } from "@/lib/mock-data";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass rounded-lg border border-white/10 px-3 py-2 text-xs">
                <p className="text-text-muted mb-1">{label}</p>
                <p className="font-semibold text-neon-cyan">{payload[0]?.value} applicants</p>
            </div>
        );
    }
    return null;
};

export default function RecruiterDashboard() {
    const [userName, setUserName] = useState("Sarah Chen");

    useEffect(() => {
        const storedName = localStorage.getItem("userName");
        if (storedName) setUserName(storedName);
    }, []);

    const analytics = mockRecruiterAnalytics;

    const statCards = [
        { label: "Total Applicants", value: analytics.totalApplicants.toLocaleString(), change: "+12%", icon: Users, color: "cyan", trend: "up" },
        { label: "Completion Rate", value: `${analytics.completionRate}%`, change: "+4%", icon: CheckCircle, color: "green", trend: "up" },
        { label: "Average Score", value: `${analytics.averageScore}%`, change: "+2%", icon: Target, color: "purple", trend: "up" },
        { label: "Pass Rate", value: `${analytics.passRate}%`, change: "-1%", icon: TrendingUp, color: "orange", trend: "down" },
    ];

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={userName} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                    <Badge variant={stat.trend === "up" ? "green" : "red"} size="sm">
                                        {stat.change}
                                    </Badge>
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
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={analytics.weeklyApplications}>
                                <defs>
                                    <linearGradient id="applicationGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#00f5ff" strokeWidth={2} fill="url(#applicationGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Score Distribution */}
                    <div className="glass rounded-2xl border border-white/8 p-6">
                        <h2 className="font-semibold text-text-primary mb-1">Score Distribution</h2>
                        <p className="text-xs text-text-muted mb-5">All-time results</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={analytics.scoreDistribution} barSize={20}>
                                <XAxis dataKey="range" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ background: "#0a0a20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                                    labelStyle={{ color: "#94a3b8" }}
                                />
                                <Bar dataKey="count" fill="url(#barGrad)" radius={[4, 4, 0, 0]}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#00f5ff" stopOpacity={0.5} />
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
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
                        <div className="space-y-3">
                            {mockInterviews.slice(0, 3).map((interview) => (
                                <Link key={interview.id} href={`/recruiter/interviews/${interview.id}`}>
                                    <div className="flex items-center gap-4 p-3.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-5 h-5 text-neon-cyan" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-sm text-text-primary truncate">{interview.title}</span>
                                                <Badge variant="green" dot size="sm">Active</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-text-muted">
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{interview.applicants} applicants</span>
                                                <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{interview.rounds.length} rounds</span>
                                                {interview.deadline && (
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {interview.deadline.toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Top Tech Stacks */}
                    <div className="glass rounded-2xl border border-white/8 p-6">
                        <h2 className="font-semibold text-text-primary mb-5">Top Tech Stacks</h2>
                        <div className="space-y-3">
                            {analytics.topTechStacks.map((stack, i) => {
                                const max = analytics.topTechStacks[0].count;
                                const percent = (stack.count / max) * 100;
                                const colors = ["cyan", "purple", "green", "orange", "blue"];
                                const color = colors[i % colors.length];
                                return (
                                    <div key={stack.name}>
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-text-secondary font-medium">{stack.name}</span>
                                            <span className="text-text-muted">{stack.count}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-neon-${color} rounded-full transition-all duration-500`}
                                                style={{ width: `${percent}%`, boxShadow: `0 0 8px var(--neon-${color})` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
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
            </main>
        </div>
    );
}
