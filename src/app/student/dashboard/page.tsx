"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    Zap, Flame, Target, TrendingUp, Clock, Award, BookOpen,
    ChevronRight, Play, BarChart3, Star, Users, Calendar, Brain
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { mockStudents, mockSkillScores, weeklyProgress, practiceTemplates } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const student = mockStudents[0];

// Heatmap data for DSA topics
const heatmapTopics = [
    { topic: "Arrays", score: 85, category: "dsa" },
    { topic: "Strings", score: 78, category: "dsa" },
    { topic: "Trees", score: 62, category: "dsa" },
    { topic: "Graphs", score: 45, category: "dsa" },
    { topic: "DP", score: 40, category: "dsa" },
    { topic: "Sorting", score: 90, category: "dsa" },
    { topic: "BST", score: 70, category: "dsa" },
    { topic: "Heap", score: 55, category: "dsa" },
    { topic: "React", score: 88, category: "frontend" },
    { topic: "JS/TS", score: 92, category: "frontend" },
    { topic: "CSS", score: 75, category: "frontend" },
    { topic: "APIs", score: 85, category: "backend" },
    { topic: "Node.js", score: 80, category: "backend" },
    { topic: "MongoDB", score: 65, category: "backend" },
    { topic: "Communication", score: 72, category: "hr" },
    { topic: "Behavioural", score: 68, category: "hr" },
];

function getHeatColor(score: number) {
    if (score >= 80) return "bg-neon-green/80 text-background border-neon-green";
    if (score >= 65) return "bg-neon-cyan/40 text-neon-cyan border-neon-cyan/50";
    if (score >= 50) return "bg-yellow-500/30 text-yellow-300 border-yellow-500/40";
    return "bg-red-500/20 text-red-300 border-red-500/30";
}

const radarData = [
    { subject: "DSA", score: 70 },
    { subject: "Frontend", score: 88 },
    { subject: "Backend", score: 78 },
    { subject: "HR", score: 68 },
    { subject: "System Design", score: 55 },
    { subject: "Aptitude", score: 82 },
];

export default function StudentDashboard() {
    const [userName, setUserName] = useState(student.name);

    useEffect(() => {
        const storedName = localStorage.getItem("userName");
        if (storedName) setUserName(storedName);
    }, []);

    const xpToNext = 10000 - student.xp;
    const xpPercent = (student.xp / 10000) * 100;

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName={userName} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-8 w-full items-center sm:items-start text-center sm:text-left">
                    <div>
                        <h1 className="text-2xl font-bold font-display">
                            Hey, {userName.split(" ")[0]} 👋
                        </h1>
                        <p className="text-text-secondary text-sm mt-0.5 mb-4">Keep going — you're on a {student.streak}-day streak! 🔥</p>
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
                                    <span className="text-2xl font-bold text-background font-display">{student.level}</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-neon-purple flex items-center justify-center">
                                    <Star className="w-2.5 h-2.5 text-neon-purple fill-neon-purple" />
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-text-muted">Level {student.level} • Code Wizard</div>
                                <div className="text-xl font-bold font-display gradient-text-cyan">{student.xp.toLocaleString()} XP</div>
                                <div className="text-xs text-text-muted">{xpToNext.toLocaleString()} XP to Level {student.level + 1}</div>
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
                                    <span className="font-semibold text-orange-400">{student.streak}</span>
                                    <span className="text-text-muted text-xs">day streak</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-neon-green" />
                                    <span className="font-semibold text-neon-green">{student.totalAttempts}</span>
                                    <span className="text-text-muted text-xs">attempts</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-yellow-400" />
                                    <span className="font-semibold text-yellow-400">{student.badges.length}</span>
                                    <span className="text-text-muted text-xs">badges</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Avg. Score", value: `${student.averageScore}%`, icon: BarChart3, color: "cyan", sub: "across all rounds" },
                        { label: "Total Attempts", value: student.totalAttempts, icon: Target, color: "purple", sub: "this month" },
                        { label: "Best Streak", value: "12 days", icon: Flame, color: "orange", sub: "personal best" },
                        { label: "Rank", value: "#8", icon: Award, color: "green", sub: "global leaderboard" },
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

                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                    {/* Weekly Progress Chart */}
                    <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="font-semibold text-text-primary">Weekly Performance</h2>
                                <p className="text-xs text-text-muted mt-0.5">Score trend this week</p>
                            </div>
                            <Badge variant="cyan">Last 7 days</Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={weeklyProgress}>
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[50, 100]} tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: "#0a0a20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                                    labelStyle={{ color: "#94a3b8" }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} fill="url(#scoreGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Skill Radar */}
                    <div className="glass rounded-2xl border border-white/8 p-6">
                        <h2 className="font-semibold text-text-primary mb-1">Skill Radar</h2>
                        <p className="text-xs text-text-muted mb-4">Your score by category</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 10 }} />
                                <Radar name="Score" dataKey="score" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.15} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Weakness Heatmap */}
                <div className="glass rounded-2xl border border-white/8 p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-semibold text-text-primary">Skill Heatmap</h2>
                            <p className="text-xs text-text-muted mt-0.5">Your topic-level performance — focus on the red zones</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/40" />Weak</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-500/30 border border-yellow-500/40" />Average</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-neon-cyan/40 border border-neon-cyan/50" />Good</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-neon-green/80 border border-neon-green" />Strong</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {heatmapTopics.map((item) => (
                            <div
                                key={item.topic}
                                className={cn(
                                    "px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer hover:scale-105 transition-transform",
                                    getHeatColor(item.score)
                                )}
                                title={`${item.topic}: ${item.score}%`}
                            >
                                <div className="font-semibold">{item.topic}</div>
                                <div className="opacity-80">{item.score}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommended Practice */}
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
            </main>
        </div>
    );
}
