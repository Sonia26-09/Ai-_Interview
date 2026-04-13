"use client";

import Link from "next/link";
import { useState } from "react";
import { Trophy, Flame, Zap, Clock, Award, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import { mockLeaderboard } from "@/lib/mock-data";

const periods = ["Weekly", "Monthly", "All Time"];

export default function LeaderboardPage() {
    const [period, setPeriod] = useState("Weekly");

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="Arjun Mehta" />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Leaderboard</h1>
                        <p className="text-text-secondary text-sm mt-0.5">Top performers this {period.toLowerCase()}</p>
                    </div>
                    <div className="flex gap-1.5 p-1 glass rounded-xl border border-white/10">
                        {periods.map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? "bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-neon-cyan border border-neon-cyan/30" : "text-text-muted hover:text-text-secondary"
                                    }`}>{p}</button>
                        ))}
                    </div>
                </div>

                {/* Top 3 Podium */}
                <div className="flex items-end justify-center gap-4 mb-8">
                    {/* 2nd place */}
                    <div className="text-center flex-1 max-w-[180px]">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-400/30 to-slate-500/20 border-2 border-slate-400/30 flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl font-bold text-slate-300">
                                {mockLeaderboard[1].student.name.charAt(0)}
                            </span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary truncate">{mockLeaderboard[1].student.name.split(" ")[0]}</div>
                        <div className="text-xs text-text-muted">{mockLeaderboard[1].averageScore}% avg</div>
                        <div className="h-20 mt-2 rounded-xl bg-gradient-to-t from-slate-500/20 to-slate-400/10 border border-slate-400/20 flex items-center justify-center">
                            <span className="text-2xl font-bold font-display text-slate-300">2</span>
                        </div>
                    </div>
                    {/* 1st place */}
                    <div className="text-center flex-1 max-w-[200px]">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-orange-400/20 border-2 border-yellow-400/50 flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                                <span className="text-2xl font-bold text-yellow-300">
                                    {mockLeaderboard[0].student.name.charAt(0)}
                                </span>
                            </div>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                        <div className="text-sm font-bold text-text-primary truncate">{mockLeaderboard[0].student.name.split(" ")[0]}</div>
                        <div className="text-xs text-neon-green font-medium">{mockLeaderboard[0].averageScore}% avg</div>
                        <div className="h-28 mt-2 rounded-xl bg-gradient-to-t from-yellow-500/20 to-yellow-400/5 border border-yellow-400/30 flex items-center justify-center">
                            <span className="text-3xl font-bold font-display text-yellow-300">1</span>
                        </div>
                    </div>
                    {/* 3rd place */}
                    <div className="text-center flex-1 max-w-[180px]">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-700/30 to-orange-600/20 border-2 border-orange-600/30 flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl font-bold text-orange-300">
                                {mockLeaderboard[2].student.name.charAt(0)}
                            </span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary truncate">{mockLeaderboard[2].student.name.split(" ")[0]}</div>
                        <div className="text-xs text-text-muted">{mockLeaderboard[2].averageScore}% avg</div>
                        <div className="h-14 mt-2 rounded-xl bg-gradient-to-t from-orange-700/20 to-orange-600/5 border border-orange-600/20 flex items-center justify-center">
                            <span className="text-2xl font-bold font-display text-orange-300">3</span>
                        </div>
                    </div>
                </div>

                {/* Full Leaderboard */}
                <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                    <div className="p-4 border-b border-white/8 grid grid-cols-12 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <span className="col-span-1">Rank</span>
                        <span className="col-span-4">Player</span>
                        <span className="col-span-2 text-right">Score</span>
                        <span className="col-span-2 text-right hidden sm:block">Attempts</span>
                        <span className="col-span-2 text-right hidden sm:block">Streak</span>
                        <span className="col-span-1 text-right">XP</span>
                    </div>
                    {mockLeaderboard.map((entry, i) => {
                        const isYou = entry.student.id === "student-1";
                        return (
                            <div key={entry.rank}
                                className={`grid grid-cols-12 items-center p-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-all ${isYou ? "bg-neon-cyan/5 border-neon-cyan/10" : ""}`}>
                                {/* Rank */}
                                <div className="col-span-1 flex items-center gap-1">
                                    <span className={`font-bold font-display ${entry.rank === 1 ? "text-yellow-400" :
                                            entry.rank === 2 ? "text-slate-300" :
                                                entry.rank === 3 ? "text-orange-400" : "text-text-muted"
                                        }`}>{entry.rank}</span>
                                    {entry.change > 0 ? <TrendingUp className="w-3 h-3 text-neon-green" /> :
                                        entry.change < 0 ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                                            <Minus className="w-3 h-3 text-text-muted" />}
                                </div>

                                {/* Name */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${entry.rank <= 3 ? "bg-gradient-to-br from-yellow-400/20 to-orange-400/10 border border-yellow-400/30 text-yellow-300" :
                                            "bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-white/10 text-text-primary"
                                        }`}>
                                        {entry.student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-text-primary flex items-center gap-2">
                                            {entry.student.name}
                                            {isYou && <Badge variant="cyan" size="sm">You</Badge>}
                                        </div>
                                        <div className="text-xs text-text-muted">{entry.badges} badges</div>
                                    </div>
                                </div>

                                {/* Avg Score */}
                                <div className="col-span-2 text-right">
                                    <span className={`font-bold ${entry.averageScore >= 80 ? "text-neon-green" : entry.averageScore >= 65 ? "text-neon-cyan" : "text-yellow-400"}`}>
                                        {entry.averageScore}%
                                    </span>
                                </div>

                                {/* Attempts */}
                                <div className="col-span-2 text-right text-sm text-text-muted hidden sm:block">{entry.totalAttempts}</div>

                                {/* Streak */}
                                <div className="col-span-2 text-right hidden sm:block">
                                    <span className="flex items-center justify-end gap-1 text-sm">
                                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="text-orange-400 font-medium">{entry.streak}</span>
                                    </span>
                                </div>

                                {/* XP */}
                                <div className="col-span-1 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Zap className="w-3 h-3 text-neon-purple" />
                                        <span className="text-xs font-semibold text-neon-purple">{(entry.student.xp / 1000).toFixed(1)}k</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
