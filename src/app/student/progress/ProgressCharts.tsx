"use client";

import React, { memo } from "react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import Badge from "@/components/ui/Badge";
import { Target, BarChart3 } from "lucide-react";
import type { AIFeedback } from "@/lib/types";

interface ProgressChartsProps {
    report: AIFeedback;
    aptitudeScore: number;
    codingScore: number;
    hrScore: number;
}

function ProgressCharts({ report, aptitudeScore, codingScore, hrScore }: ProgressChartsProps) {
    const radarData = report.topicBreakdown.map(t => ({
        subject: t.topic,
        score: t.score,
    }));

    const barData = [
        { name: "Aptitude", score: aptitudeScore, color: "#3b82f6" },
        { name: "Coding", score: codingScore, color: "#00f5ff" },
        { name: "HR", score: hrScore, color: "#a855f7" },
        { name: "Problem Solving", score: report.topicBreakdown.find(t => t.topic === "Problem Solving")?.score ?? 0, color: "#00ff88" },
        { name: "Speed", score: report.topicBreakdown.find(t => t.topic === "Speed & Accuracy")?.score ?? 0, color: "#f97316" },
    ];

    return (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart */}
            <div className="glass rounded-2xl border border-white/8 p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-semibold text-text-primary flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-neon-cyan" />
                            Score Breakdown
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5">Performance by category</p>
                    </div>
                    <Badge variant="cyan" size="sm">Latest</Badge>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} barSize={28}>
                        <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ background: "#0a0a20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                            labelStyle={{ color: "#e2e8f0" }}
                            itemStyle={{ color: "#94a3b8" }}
                            formatter={(value: number) => [`${value}%`, "Score"]}
                        />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                            {barData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="glass rounded-2xl border border-white/8 p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-semibold text-text-primary flex items-center gap-2">
                            <Target className="w-4 h-4 text-neon-purple" />
                            Skill Radar
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5">Multi-dimensional skill view</p>
                    </div>
                    <Badge variant="purple" size="sm">AI Analysis</Badge>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData} margin={{ top: 5, right: 25, bottom: 5, left: 25 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 10 }} />
                        <Radar name="Score" dataKey="score" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default memo(ProgressCharts);
