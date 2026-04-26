"use client";

import { useState, useEffect } from "react";
import { Trophy, Flame, Zap, TrendingUp, Award, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    averageScore: number;
    totalAttempts: number;
    streak: number;
    xp: number;
    level: number;
    badgeCount: number;
    isYou: boolean;
}

// ─── Skeleton ───────────────────────────────────────────────────
function LeaderboardSkeleton() {
    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="..." />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-white/5 rounded-lg" />
                    <div className="flex items-end justify-center gap-4">
                        <div className="h-36 w-40 bg-white/5 rounded-xl" />
                        <div className="h-44 w-48 bg-white/5 rounded-xl" />
                        <div className="h-28 w-40 bg-white/5 rounded-xl" />
                    </div>
                    <div className="h-96 bg-white/5 rounded-2xl border border-white/8" />
                </div>
            </main>
        </div>
    );
}

// ─── Empty State ────────────────────────────────────────────────
function EmptyLeaderboard() {
    return (
        <div className="glass rounded-2xl border border-neon-cyan/20 p-10 text-center bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-white/10 flex items-center justify-center mx-auto mb-5">
                <Users className="w-8 h-8 text-neon-cyan" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">No Competitors Yet</h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
                Be the first to complete a mock interview and claim the top spot! Your scores will appear here once you practice.
            </p>
        </div>
    );
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState("Student");

    useEffect(() => {
        const storedName = localStorage.getItem("userName");
        if (storedName) setUserName(storedName);

        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/leaderboard");
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard || []);
                }
            } catch {
                // silently fail
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeaderboard();
    }, []);

    if (isLoading) return <LeaderboardSkeleton />;

    // Top 3 for podium (fill with placeholders if < 3 entries)
    const top3 = [leaderboard[1] || null, leaderboard[0] || null, leaderboard[2] || null]; // [2nd, 1st, 3rd]

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName={userName} />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            Leaderboard
                        </h1>
                        <p className="text-text-secondary text-sm mt-0.5">Top performers based on real interview scores</p>
                    </div>
                    <Badge variant="cyan" size="sm" dot>Live from Database</Badge>
                </div>

                {leaderboard.length === 0 ? (
                    <EmptyLeaderboard />
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {leaderboard.length >= 2 && (
                            <div className="flex items-end justify-center gap-4 mb-8">
                                {/* 2nd place */}
                                {top3[0] ? (
                                    <div className="text-center flex-1 max-w-[180px]">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-400/30 to-slate-500/20 border-2 border-slate-400/30 flex items-center justify-center mx-auto mb-2">
                                            <span className="text-xl font-bold text-slate-300">
                                                {top3[0].name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="text-sm font-semibold text-text-primary truncate">
                                            {top3[0].name.split(" ")[0]}
                                            {top3[0].isYou && <span className="text-neon-cyan text-xs ml-1">(You)</span>}
                                        </div>
                                        <div className="text-xs text-text-muted">{top3[0].averageScore}% avg</div>
                                        <div className="h-20 mt-2 rounded-xl bg-gradient-to-t from-slate-500/20 to-slate-400/10 border border-slate-400/20 flex items-center justify-center">
                                            <span className="text-2xl font-bold font-display text-slate-300">2</span>
                                        </div>
                                    </div>
                                ) : <div className="flex-1 max-w-[180px]" />}

                                {/* 1st place */}
                                {top3[1] && (
                                    <div className="text-center flex-1 max-w-[200px]">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-orange-400/20 border-2 border-yellow-400/50 flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                                                <span className="text-2xl font-bold text-yellow-300">
                                                    {top3[1].name.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <Trophy className="w-6 h-6 text-yellow-400" />
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-text-primary truncate">
                                            {top3[1].name.split(" ")[0]}
                                            {top3[1].isYou && <span className="text-neon-cyan text-xs ml-1">(You)</span>}
                                        </div>
                                        <div className="text-xs text-neon-green font-medium">{top3[1].averageScore}% avg</div>
                                        <div className="h-28 mt-2 rounded-xl bg-gradient-to-t from-yellow-500/20 to-yellow-400/5 border border-yellow-400/30 flex items-center justify-center">
                                            <span className="text-3xl font-bold font-display text-yellow-300">1</span>
                                        </div>
                                    </div>
                                )}

                                {/* 3rd place */}
                                {top3[2] ? (
                                    <div className="text-center flex-1 max-w-[180px]">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-700/30 to-orange-600/20 border-2 border-orange-600/30 flex items-center justify-center mx-auto mb-2">
                                            <span className="text-xl font-bold text-orange-300">
                                                {top3[2].name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="text-sm font-semibold text-text-primary truncate">
                                            {top3[2].name.split(" ")[0]}
                                            {top3[2].isYou && <span className="text-neon-cyan text-xs ml-1">(You)</span>}
                                        </div>
                                        <div className="text-xs text-text-muted">{top3[2].averageScore}% avg</div>
                                        <div className="h-14 mt-2 rounded-xl bg-gradient-to-t from-orange-700/20 to-orange-600/5 border border-orange-600/20 flex items-center justify-center">
                                            <span className="text-2xl font-bold font-display text-orange-300">3</span>
                                        </div>
                                    </div>
                                ) : <div className="flex-1 max-w-[180px]" />}
                            </div>
                        )}

                        {/* Full Leaderboard Table */}
                        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                            <div className="p-4 border-b border-white/8 grid grid-cols-12 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                <span className="col-span-1">Rank</span>
                                <span className="col-span-4">Player</span>
                                <span className="col-span-2 text-right">Score</span>
                                <span className="col-span-2 text-right hidden sm:block">Attempts</span>
                                <span className="col-span-2 text-right hidden sm:block">Streak</span>
                                <span className="col-span-1 text-right">XP</span>
                            </div>
                            {leaderboard.map((entry) => (
                                <div key={entry.id}
                                    className={`grid grid-cols-12 items-center p-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-all ${entry.isYou ? "bg-neon-cyan/5 border-neon-cyan/10" : ""}`}>
                                    {/* Rank */}
                                    <div className="col-span-1 flex items-center gap-1">
                                        <span className={`font-bold font-display ${entry.rank === 1 ? "text-yellow-400" :
                                            entry.rank === 2 ? "text-slate-300" :
                                                entry.rank === 3 ? "text-orange-400" : "text-text-muted"
                                            }`}>{entry.rank}</span>
                                        {entry.rank <= 3 && <TrendingUp className="w-3 h-3 text-neon-green" />}
                                    </div>

                                    {/* Name */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${entry.rank <= 3 ? "bg-gradient-to-br from-yellow-400/20 to-orange-400/10 border border-yellow-400/30 text-yellow-300" :
                                            "bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-white/10 text-text-primary"
                                            }`}>
                                            {entry.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-text-primary flex items-center gap-2">
                                                {entry.name}
                                                {entry.isYou && <Badge variant="cyan" size="sm">You</Badge>}
                                            </div>
                                            <div className="text-xs text-text-muted">{entry.badgeCount} badge{entry.badgeCount !== 1 ? "s" : ""}</div>
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
                                            <span className="text-xs font-semibold text-neon-purple">
                                                {entry.xp >= 1000 ? `${(entry.xp / 1000).toFixed(1)}k` : entry.xp}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
