"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    BarChart3, Users, Target, TrendingUp, CheckCircle, XCircle,
    Brain, ChevronDown, ChevronUp, ArrowLeft, Search, Filter,
    Trophy, UserCheck, UserX, Clock, Eye
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from "recharts";

interface SubmissionData {
    id: string;
    studentName: string;
    studentEmail: string;
    overallScore: number;
    roundScores: { type: string; score: number }[];
    status: "selected" | "rejected";
    completedAt: string;
}

interface InterviewAnalytics {
    id: string;
    title: string;
    status: string;
    rounds: number;
    passingScore: number;
    totalApplicants: number;
    averageScore: number;
    selected: number;
    rejected: number;
    createdAt: string;
}

interface AnalyticsData {
    totalApplicants: number;
    totalInterviews: number;
    averageScore: number;
    passRate: number;
    selectedCount: number;
    rejectedCount: number;
    scoreDistribution: { range: string; count: number }[];
    weeklyApplications: { day: string; count: number }[];
    perInterview: InterviewAnalytics[];
    topTechStacks: { name: string; count: number }[];
}

const SCORE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4"];

export default function RecruiterAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState("Recruiter");
    const [expandedInterview, setExpandedInterview] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<Record<string, SubmissionData[]>>({});
    const [loadingSubs, setLoadingSubs] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                const [meRes, analyticsRes] = await Promise.all([
                    fetch("/api/auth/me"),
                    fetch("/api/recruiter/analytics"),
                ]);
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUserName(meData.user.name);
                }
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    setAnalytics(data);
                }
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const toggleInterview = async (interviewId: string) => {
        if (expandedInterview === interviewId) {
            setExpandedInterview(null);
            return;
        }
        setExpandedInterview(interviewId);

        // Fetch submissions if not already loaded
        if (!submissions[interviewId]) {
            setLoadingSubs(interviewId);
            try {
                const res = await fetch(`/api/interviews/${interviewId}/submissions`);
                if (res.ok) {
                    const data = await res.json();
                    setSubmissions(prev => ({ ...prev, [interviewId]: data.submissions }));
                }
            } catch (err) {
                console.error("Failed to fetch submissions:", err);
            } finally {
                setLoadingSubs(null);
            }
        }
    };

    const filteredInterviews = analytics?.perInterview.filter(iv =>
        iv.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // ── Loading ───────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar role="recruiter" userName={userName} />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-48 bg-white/5 rounded-lg" />
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/8" />)}
                        </div>
                        <div className="h-64 bg-white/5 rounded-2xl border border-white/8" />
                    </div>
                </div>
            </div>
        );
    }

    const stats = analytics || {
        totalApplicants: 0, totalInterviews: 0, averageScore: 0, passRate: 0,
        selectedCount: 0, rejectedCount: 0, scoreDistribution: [], weeklyApplications: [],
        perInterview: [], topTechStacks: [],
    };

    const statCards = [
        { label: "Total Applicants", value: stats.totalApplicants, icon: Users, color: "cyan" },
        { label: "Average Score", value: stats.averageScore > 0 ? `${stats.averageScore}%` : "—", icon: Target, color: "purple" },
        { label: "Selected", value: stats.selectedCount, icon: UserCheck, color: "green" },
        { label: "Rejected", value: stats.rejectedCount, icon: UserX, color: "red" },
    ];

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={userName} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/recruiter/dashboard" className="text-text-muted hover:text-text-secondary transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display">Analytics</h1>
                        <p className="text-text-secondary text-sm mt-0.5">Track interview performance and candidate results</p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="glass rounded-2xl border border-white/8 p-5 hover:border-white/15 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-neon-${stat.color}/10 border border-neon-${stat.color}/20 flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 text-neon-${stat.color}`} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold font-display text-text-primary">{stat.value}</div>
                                <div className="text-xs text-text-muted mt-1">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Score Distribution */}
                    <div className="glass rounded-2xl border border-white/8 p-6">
                        <h2 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-neon-cyan" />Score Distribution
                        </h2>
                        <p className="text-xs text-text-muted mb-5">All candidates across all interviews</p>
                        {stats.totalApplicants > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={stats.scoreDistribution} barSize={36}>
                                    <XAxis dataKey="range" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                        labelStyle={{ color: "#e2e8f0" }}
                                        itemStyle={{ color: "#94a3b8" }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {stats.scoreDistribution.map((_, i) => (
                                            <Cell key={i} fill={SCORE_COLORS[i]} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[180px] flex items-center justify-center text-text-muted text-sm">
                                <p className="text-xs text-text-muted/60">No submissions yet</p>
                            </div>
                        )}
                    </div>

                    {/* Pass Rate Summary */}
                    <div className="glass rounded-2xl border border-white/8 p-6">
                        <h2 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-neon-green" />Selection Overview
                        </h2>
                        <p className="text-xs text-text-muted mb-5">Based on passing scores</p>
                        {stats.totalApplicants > 0 ? (
                            <div className="flex items-center justify-center gap-8">
                                <div className="relative w-32 h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: "Selected", value: stats.selectedCount },
                                                    { name: "Rejected", value: stats.rejectedCount },
                                                ]}
                                                cx="50%" cy="50%"
                                                innerRadius={35} outerRadius={55}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                <Cell fill="#22c55e" fillOpacity={0.8} />
                                                <Cell fill="#ef4444" fillOpacity={0.6} />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-bold text-text-primary">{stats.passRate}%</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-neon-green" />
                                        <div>
                                            <div className="text-sm font-semibold text-text-primary">{stats.selectedCount} Selected</div>
                                            <div className="text-xs text-text-muted">Passed threshold</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div>
                                            <div className="text-sm font-semibold text-text-primary">{stats.rejectedCount} Rejected</div>
                                            <div className="text-xs text-text-muted">Below threshold</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[180px] flex items-center justify-center text-text-muted text-sm">
                                <p className="text-xs text-text-muted/60">No submissions yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Per-Interview Breakdown */}
                <div className="glass rounded-2xl border border-white/8 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-semibold text-text-primary flex items-center gap-2">
                                <Brain className="w-4 h-4 text-neon-purple" />Interview Results
                            </h2>
                            <p className="text-xs text-text-muted mt-0.5">Click an interview to see individual candidate results</p>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search interviews..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-neon-cyan/40 transition-colors w-56"
                            />
                        </div>
                    </div>

                    {filteredInterviews.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">
                            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No interviews found</p>
                            <p className="text-xs text-text-muted/60 mt-1">Create an interview to start tracking results</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredInterviews.map(iv => {
                                const isExpanded = expandedInterview === iv.id;
                                const subs = submissions[iv.id] || [];
                                const isLoadingThis = loadingSubs === iv.id;

                                return (
                                    <div key={iv.id} className="rounded-xl border border-white/8 overflow-hidden bg-white/2 hover:border-white/15 transition-all">
                                        {/* Interview Header */}
                                        <button
                                            className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors"
                                            onClick={() => toggleInterview(iv.id)}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center flex-shrink-0">
                                                <Brain className="w-5 h-5 text-neon-purple" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-medium text-sm text-text-primary">{iv.title}</span>
                                                    <Badge variant={iv.status === "active" ? "green" : "default"} size="sm" dot>{iv.status}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-text-muted">
                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{iv.totalApplicants} applicants</span>
                                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />Avg: {iv.averageScore > 0 ? `${iv.averageScore}%` : "—"}</span>
                                                    <span className="flex items-center gap-1 text-neon-green"><UserCheck className="w-3 h-3" />{iv.selected}</span>
                                                    <span className="flex items-center gap-1 text-red-400"><UserX className="w-3 h-3" />{iv.rejected}</span>
                                                    <span>Pass: {iv.passingScore}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Link href={`/recruiter/interviews/${iv.id}`} onClick={e => e.stopPropagation()}>
                                                    <Button variant="outline" size="sm" leftIcon={<Eye className="w-3 h-3" />}>View</Button>
                                                </Link>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                            </div>
                                        </button>

                                        {/* Expanded: Student Results */}
                                        {isExpanded && (
                                            <div className="border-t border-white/8">
                                                {isLoadingThis ? (
                                                    <div className="p-6 text-center">
                                                        <div className="animate-spin w-6 h-6 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full mx-auto mb-2" />
                                                        <p className="text-xs text-text-muted">Loading submissions...</p>
                                                    </div>
                                                ) : subs.length === 0 ? (
                                                    <div className="p-6 text-center text-text-muted">
                                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">No submissions yet</p>
                                                        <p className="text-xs text-text-muted/60 mt-1">Share this interview link with candidates</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-4">
                                                        {/* Table Header */}
                                                        <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-white/8 mb-2">
                                                            <div className="col-span-3">Candidate</div>
                                                            <div className="col-span-2">Email</div>
                                                            <div className="col-span-2 text-center">Score</div>
                                                            <div className="col-span-2 text-center">Round Scores</div>
                                                            <div className="col-span-1 text-center">Status</div>
                                                            <div className="col-span-2 text-right">Completed</div>
                                                        </div>

                                                        {/* Rows */}
                                                        {subs.map((sub) => (
                                                            <div key={sub.id} className={`grid grid-cols-12 gap-3 px-3 py-3 rounded-lg text-sm items-center transition-all hover:bg-white/3 ${sub.status === "selected" ? "border-l-2 border-neon-green/40" : "border-l-2 border-red-500/40"}`}>
                                                                <div className="col-span-3 flex items-center gap-2">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${sub.status === "selected" ? "bg-neon-green/15 text-neon-green border border-neon-green/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                                                                        {sub.studentName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-medium text-text-primary truncate">{sub.studentName}</span>
                                                                </div>
                                                                <div className="col-span-2 text-text-muted text-xs truncate">{sub.studentEmail}</div>
                                                                <div className="col-span-2 text-center">
                                                                    <span className={`text-lg font-bold ${sub.overallScore >= 80 ? "text-neon-green" : sub.overallScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                                                                        {sub.overallScore}%
                                                                    </span>
                                                                </div>
                                                                <div className="col-span-2 flex items-center justify-center gap-1.5">
                                                                    {sub.roundScores.map((rs, i) => (
                                                                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 text-text-secondary" title={`${rs.type}: ${rs.score}%`}>
                                                                            {rs.type.charAt(0).toUpperCase()}: {rs.score}%
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <div className="col-span-1 flex justify-center">
                                                                    <Badge variant={sub.status === "selected" ? "green" : "red"} size="sm">
                                                                        {sub.status === "selected" ? "Selected" : "Rejected"}
                                                                    </Badge>
                                                                </div>
                                                                <div className="col-span-2 text-right text-xs text-text-muted">
                                                                    {new Date(sub.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
