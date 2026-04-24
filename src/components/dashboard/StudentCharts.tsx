"use client";

import React, { memo } from "react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

// ─── Heatmap colors ─────────────────────────────────────────────
function getHeatColor(score: number) {
    if (score >= 80) return "bg-neon-green/80 text-background border-neon-green";
    if (score >= 65) return "bg-neon-cyan/40 text-neon-cyan border-neon-cyan/50";
    if (score >= 50) return "bg-yellow-500/30 text-yellow-300 border-yellow-500/40";
    return "bg-red-500/20 text-red-300 border-red-500/30";
}

interface StudentChartsProps {
    averageScore: number;
}

// ─── Zero-state data generators ─────────────────────────────────
function getWeeklyProgress(hasData: boolean) {
    if (!hasData) {
        return [
            { day: "Mon", score: 0 }, { day: "Tue", score: 0 }, { day: "Wed", score: 0 },
            { day: "Thu", score: 0 }, { day: "Fri", score: 0 }, { day: "Sat", score: 0 }, { day: "Sun", score: 0 },
        ];
    }
    // Placeholder until real weekly data is tracked
    return [
        { day: "Mon", score: 0 }, { day: "Tue", score: 0 }, { day: "Wed", score: 0 },
        { day: "Thu", score: 0 }, { day: "Fri", score: 0 }, { day: "Sat", score: 0 }, { day: "Sun", score: 0 },
    ];
}

function getRadarData(hasData: boolean) {
    if (!hasData) {
        return [
            { subject: "DSA", score: 0 }, { subject: "Frontend", score: 0 },
            { subject: "Backend", score: 0 }, { subject: "HR", score: 0 },
            { subject: "System Design", score: 0 }, { subject: "Aptitude", score: 0 },
        ];
    }
    // Placeholder until real per-category data is tracked
    return [
        { subject: "DSA", score: 0 }, { subject: "Frontend", score: 0 },
        { subject: "Backend", score: 0 }, { subject: "HR", score: 0 },
        { subject: "System Design", score: 0 }, { subject: "Aptitude", score: 0 },
    ];
}

function getHeatmapTopics(hasData: boolean) {
    const topics = [
        { topic: "Arrays", score: 0, category: "dsa" },
        { topic: "Strings", score: 0, category: "dsa" },
        { topic: "Trees", score: 0, category: "dsa" },
        { topic: "Graphs", score: 0, category: "dsa" },
        { topic: "DP", score: 0, category: "dsa" },
        { topic: "Sorting", score: 0, category: "dsa" },
        { topic: "React", score: 0, category: "frontend" },
        { topic: "JS/TS", score: 0, category: "frontend" },
        { topic: "CSS", score: 0, category: "frontend" },
        { topic: "APIs", score: 0, category: "backend" },
        { topic: "Node.js", score: 0, category: "backend" },
        { topic: "MongoDB", score: 0, category: "backend" },
        { topic: "Communication", score: 0, category: "hr" },
        { topic: "Behavioural", score: 0, category: "hr" },
    ];
    return topics;
}

function StudentCharts({ averageScore }: StudentChartsProps) {
    const hasData = averageScore > 0;
    const weeklyProgress = getWeeklyProgress(hasData);
    const radarData = getRadarData(hasData);
    const heatmapTopics = getHeatmapTopics(hasData);

    return (
        <>
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
                    {!hasData ? (
                        <div className="h-[160px] flex items-center justify-center text-text-muted text-sm">
                            <div className="text-center">
                                <p className="mb-1">No practice data yet</p>
                                <p className="text-xs text-text-muted/60">Complete a practice session to see your progress</p>
                            </div>
                        </div>
                    ) : (
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
                                <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: "#0a0a20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                                    labelStyle={{ color: "#94a3b8" }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} fill="url(#scoreGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Skill Radar */}
                <div className="glass rounded-2xl border border-white/8 p-6">
                    <h2 className="font-semibold text-text-primary mb-1">Skill Radar</h2>
                    <p className="text-xs text-text-muted mb-4">Your score by category</p>
                    {!hasData ? (
                        <div className="h-[180px] flex items-center justify-center text-text-muted text-sm">
                            <div className="text-center">
                                <p className="text-xs text-text-muted/60">Complete rounds to see skill breakdown</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 10 }} />
                                <Radar name="Score" dataKey="score" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.15} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Weakness Heatmap */}
            <div className="glass rounded-2xl border border-white/8 p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-semibold text-text-primary">Skill Heatmap</h2>
                        <p className="text-xs text-text-muted mt-0.5">
                            {hasData ? "Your topic-level performance — focus on the red zones" : "Complete practice rounds to see your skill heatmap"}
                        </p>
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
        </>
    );
}

export default memo(StudentCharts);
