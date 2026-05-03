"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Star, Users, Clock, Brain, Play, ChevronRight, Building2, Target, Code2, Mic, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { practiceTemplates } from "@/lib/mock-data";
import { formatDuration } from "@/lib/utils";

const diffFilters = ["All", "Easy", "Medium", "Hard"];

const colorMap: Record<string, any> = {
    cyan: "cyan", purple: "purple", green: "green", orange: "orange", blue: "blue", pink: "pink"
};

interface DBInterview {
    id: string;
    title: string;
    role: string;
    company: string;
    description: string;
    rounds: { id: string; type: string; title: string; duration: number; difficulty: string; questionCount: number; isRequired: boolean; order: number }[];
    status: string;
    deadline: string | null;
    applicants: number;
    passingScore: number;
    techStack: string[];
    difficulty: string;
    antiCheat: boolean;
    createdAt: string;
    recruiterName: string;
}

export default function StudentPracticePage() {
    const [search, setSearch] = useState("");
    const [diffFilter, setDiffFilter] = useState("All");
    const [dbInterviews, setDbInterviews] = useState<DBInterview[]>([]);
    const [isLoadingDB, setIsLoadingDB] = useState(true);
    const [userName, setUserName] = useState("Student");

    useEffect(() => {
        // Fetch user name
        async function fetchUser() {
            try {
                const meRes = await fetch("/api/auth/me");
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUserName(meData.user.name);
                }
            } catch {
                const storedName = localStorage.getItem("userName");
                if (storedName) setUserName(storedName);
            }
        }
        fetchUser();

        // Fetch recruiter-created interviews (public)
        async function fetchDBInterviews() {
            try {
                const res = await fetch("/api/interviews?public=true");
                if (res.ok) {
                    const data = await res.json();
                    setDbInterviews(data.interviews || []);
                }
            } catch (err) {
                console.error("Failed to fetch interviews:", err);
            } finally {
                setIsLoadingDB(false);
            }
        }
        fetchDBInterviews();
    }, []);

    const filteredTemplates = practiceTemplates.filter(t => {
        const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase());
        const matchDiff = diffFilter === "All" || t.difficulty === diffFilter;
        return matchSearch && matchDiff;
    });

    const filteredDB = dbInterviews.filter(i => {
        const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
            (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
            (i.role || "").toLowerCase().includes(search.toLowerCase());
        const matchDiff = diffFilter === "All" || i.difficulty === diffFilter;
        return matchSearch && matchDiff;
    });

    const roundIcons: Record<string, any> = { aptitude: Target, coding: Code2, hr: Mic };
    const roundColors: Record<string, string> = { aptitude: "blue", coding: "cyan", hr: "purple" };

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName={userName} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold font-display">Practice Interviews</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Choose a template and get AI feedback instantly</p>
                </div>

                {/* AI Suggestion Banner */}
                <div className="glass rounded-2xl border border-neon-purple/20 p-5 mb-6 bg-gradient-to-r from-neon-purple/5 to-neon-cyan/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-background" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-text-primary text-sm mb-0.5">AI Recommends: DSA Interview Prep</div>
                        <p className="text-xs text-text-muted">Based on your weak spots in Trees & Dynamic Programming — 92% improvement for this pattern</p>
                    </div>
                    <Link href="/interview/pt-2">
                        <Button variant="neon-purple" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                            Practice Now
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1">
                        <Input placeholder="Search practice templates..." value={search}
                            onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
                    </div>
                    <div className="flex gap-1.5">
                        {diffFilters.map(f => (
                            <button key={f} onClick={() => setDiffFilter(f)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${diffFilter === f ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan" : "glass border-white/10 text-text-muted hover:border-white/20"
                                    }`}>{f}</button>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    Company Interviews (from Database — recruiter created)
                   ═══════════════════════════════════════════════════════════════ */}
                {(isLoadingDB || filteredDB.length > 0) && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-white/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-neon-cyan" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-text-primary">Company Interviews</h2>
                                <p className="text-xs text-text-muted">Real interviews posted by recruiters</p>
                            </div>
                            {!isLoadingDB && (
                                <Badge variant="cyan" size="sm" className="ml-auto">{filteredDB.length} available</Badge>
                            )}
                        </div>

                        {isLoadingDB ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="glass rounded-2xl border border-white/8 p-5 animate-pulse">
                                        <div className="h-5 w-40 bg-white/5 rounded mb-3" />
                                        <div className="h-4 w-full bg-white/5 rounded mb-2" />
                                        <div className="h-3 w-32 bg-white/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredDB.map((interview) => {
                                    const totalDuration = interview.rounds.reduce((a, r) => a + r.duration, 0);
                                    const totalQuestions = interview.rounds.reduce((a, r) => a + r.questionCount, 0);
                                    return (
                                        <Link key={interview.id} href={`/interview/${interview.id}`}>
                                            <div className="glass rounded-2xl border border-white/8 p-5 hover:border-neon-cyan/30 hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer h-full">
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <Badge variant={interview.difficulty === "Hard" ? "red" : interview.difficulty === "Medium" ? "yellow" : "green"} size="sm">
                                                        {interview.difficulty}
                                                    </Badge>
                                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        {interview.company || interview.recruiterName}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-bold text-text-primary mb-1 group-hover:text-neon-cyan transition-colors">{interview.title}</h3>
                                                {interview.role && (
                                                    <p className="text-xs text-text-secondary mb-1">{interview.role}</p>
                                                )}
                                                <p className="text-xs text-text-muted leading-relaxed mb-4 flex-1 line-clamp-2">{interview.description}</p>

                                                {/* Round Tags */}
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {interview.rounds.map((round) => {
                                                        const Icon = roundIcons[round.type] || Target;
                                                        const color = roundColors[round.type] || "cyan";
                                                        return (
                                                            <span key={round.id} className={`text-xs px-2 py-0.5 rounded-md border bg-neon-${color}/10 border-neon-${color}/20 text-neon-${color} flex items-center gap-1`}>
                                                                <Icon className="w-3 h-3" />
                                                                {round.title}
                                                            </span>
                                                        );
                                                    })}
                                                </div>

                                                {/* Tech Stack */}
                                                {interview.techStack.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {interview.techStack.slice(0, 4).map(stack => (
                                                            <span key={stack} className="text-xs px-2 py-0.5 glass rounded-md border border-white/10 text-text-muted">{stack}</span>
                                                        ))}
                                                        {interview.techStack.length > 4 && (
                                                            <span className="text-xs px-2 py-0.5 glass rounded-md border border-white/10 text-text-muted">+{interview.techStack.length - 4}</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(totalDuration)}</span>
                                                    <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{interview.rounds.length} rounds</span>
                                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{totalQuestions} Q</span>
                                                </div>

                                                {/* CTA */}
                                                <Button variant="primary" size="md" className="w-full" leftIcon={<Play className="w-4 h-4" />}>
                                                    Start Interview
                                                </Button>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    Practice Templates (hardcoded/mock)
                   ═══════════════════════════════════════════════════════════════ */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 border border-white/10 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-neon-purple" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-text-primary">Practice Templates</h2>
                        <p className="text-xs text-text-muted">AI-powered practice interviews for self-improvement</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTemplates.map((t) => (
                        <div key={t.id} className="glass rounded-2xl border border-white/8 p-5 hover:border-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant={colorMap[t.color] || "default"} size="sm">{t.difficulty}</Badge>
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                    {t.rating}
                                    <span className="ml-2 flex gap-1">
                                        {Array.from({ length: Math.round(t.rating) }).map((_, i) => (
                                            <span key={i} className={`w-1.5 h-1.5 rounded-full bg-neon-${t.color}/60`} />
                                        ))}
                                    </span>
                                </div>
                            </div>

                            {/* Title & Desc */}
                            <h3 className={`font-bold text-text-primary mb-1 group-hover:text-neon-${t.color} transition-colors`}>{t.title}</h3>
                            <p className="text-xs text-text-muted leading-relaxed mb-4 flex-1">{t.description}</p>

                            {/* Tech Stack */}
                            {t.techStack.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {t.techStack.map(stack => (
                                        <span key={stack} className="text-xs px-2 py-0.5 glass rounded-md border border-white/10 text-text-muted">{stack}</span>
                                    ))}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duration}m</span>
                                <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{t.rounds} rounds</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(t.attempts / 1000).toFixed(0)}K attempts</span>
                            </div>

                            <Link href={`/interview/${t.id}`} className="block">
                                <Button variant={`neon-${t.color}` as any} size="md" className="w-full"
                                    leftIcon={<Play className="w-4 h-4" />}>
                                    Start Practice
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
