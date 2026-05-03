"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    Search, Plus, Users, Brain, Calendar,
    Building2, Clock, MoreVertical, Trash2, Eye, PlayCircle, PauseCircle, Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { formatDuration } from "@/lib/utils";

const statusColors: Record<string, any> = {
    active: "green",
    paused: "orange",
    draft: "yellow",
    closed: "default",
    archived: "default",
};

interface InterviewRound {
    id: string;
    type: "aptitude" | "coding" | "hr";
    title: string;
    duration: number;
    difficulty: string;
    questionCount: number;
    isRequired: boolean;
    order: number;
}

interface InterviewData {
    id: string;
    title: string;
    role: string;
    company: string;
    description: string;
    rounds: InterviewRound[];
    status: string;
    deadline: string | null;
    applicants: number;
    passingScore: number;
    techStack: string[];
    difficulty: string;
    antiCheat: boolean;
    createdAt: string;
}

export default function RecruiterInterviews() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft" | "closed">("all");
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [userName, setUserName] = useState("Recruiter");
    const [interviews, setInterviews] = useState<InterviewData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            // Fetch user name
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

            // Fetch interviews from DB
            try {
                const res = await fetch("/api/interviews");
                if (res.ok) {
                    const data = await res.json();
                    setInterviews(data.interviews || []);
                }
            } catch (err) {
                console.error("Failed to fetch interviews:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    // ── Toggle Pause / Activate ───────────────────────────────────────
    const handleTogglePause = async (interviewId: string, currentStatus: string) => {
        setActionLoading(interviewId);
        setOpenMenu(null);
        const newStatus = currentStatus === "active" ? "paused" : "active";
        try {
            const res = await fetch(`/api/interviews/${interviewId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setInterviews(prev =>
                    prev.map(i => i.id === interviewId ? { ...i, status: newStatus } : i)
                );
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to update interview status.");
            }
        } catch (err) {
            console.error("Toggle pause error:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    // ── Delete Interview ──────────────────────────────────────────────
    const handleDelete = async (interviewId: string) => {
        setActionLoading(interviewId);
        setDeleteConfirm(null);
        setOpenMenu(null);
        try {
            const res = await fetch(`/api/interviews/${interviewId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setInterviews(prev => prev.filter(i => i.id !== interviewId));
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to delete interview.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenMenu(null);
            setDeleteConfirm(null);
        };
        if (openMenu || deleteConfirm) {
            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }
    }, [openMenu, deleteConfirm]);

    const filtered = interviews.filter((i) => {
        const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
            (i.role || "").toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "all" || i.status === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={userName} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Interviews</h1>
                        <p className="text-text-secondary text-sm mt-0.5">{interviews.length} total interviews created</p>
                    </div>
                    <Link href="/recruiter/interviews/create">
                        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Interview</Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search interviews..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(["all", "active", "paused", "draft", "closed"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${filter === f
                                        ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                                        : "glass border-white/10 text-text-muted hover:border-white/20 hover:text-text-secondary"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass rounded-2xl border border-white/8 p-5 animate-pulse">
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-white/5" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-5 w-48 bg-white/5 rounded" />
                                        <div className="h-4 w-72 bg-white/5 rounded" />
                                        <div className="h-3 w-56 bg-white/5 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Interview Cards */}
                {!isLoading && (
                    <div className="space-y-3">
                        {filtered.map((interview) => (
                            <div key={interview.id} className={`glass rounded-2xl border p-5 hover:border-white/15 transition-all group ${actionLoading === interview.id ? "opacity-60 pointer-events-none" : "border-white/8"}`}>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-5 h-5 text-neon-cyan" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-text-primary">{interview.title}</h3>
                                                <Badge variant={statusColors[interview.status] || "default"} dot size="sm">
                                                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                                </Badge>
                                                <Badge variant={interview.difficulty === "Hard" ? "red" : interview.difficulty === "Medium" ? "yellow" : "green"} size="sm">
                                                    {interview.difficulty}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-text-muted mb-3 line-clamp-1">{interview.description || interview.role}</p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                                                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{interview.applicants} applicants</span>
                                                <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" />{interview.rounds.length} rounds</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />
                                                    {formatDuration(interview.rounds.reduce((a, r) => a + r.duration, 0))}
                                                </span>
                                                {interview.deadline && (
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />
                                                        Due {new Date(interview.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Round Types */}
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {interview.rounds.map((round) => (
                                                    <span key={round.id} className={`text-xs px-2 py-0.5 rounded-md border ${round.type === "aptitude" ? "bg-neon-blue/10 border-neon-blue/20 text-neon-blue" :
                                                            round.type === "coding" ? "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan" :
                                                                "bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
                                                        }`}>
                                                        {round.type === "aptitude" ? "🧮" : round.type === "coding" ? "💻" : "🤝"} {round.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                                        <Link href={`/recruiter/interviews/${interview.id}`}>
                                            <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>View</Button>
                                        </Link>
                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setOpenMenu(openMenu === interview.id ? null : interview.id)}
                                                className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all"
                                            >
                                                {actionLoading === interview.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <MoreVertical className="w-4 h-4" />
                                                )}
                                            </button>
                                            {openMenu === interview.id && (
                                                <div className="absolute right-0 top-full mt-1 w-44 glass rounded-xl border border-white/10 shadow-glass z-10 p-1">
                                                    <button
                                                        onClick={() => handleTogglePause(interview.id, interview.status)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-white/5 rounded-lg transition-all"
                                                    >
                                                        {interview.status === "active" ? (
                                                            <><PauseCircle className="w-3.5 h-3.5" />Pause Interview</>
                                                        ) : (
                                                            <><PlayCircle className="w-3.5 h-3.5" />Activate Interview</>
                                                        )}
                                                    </button>
                                                    <hr className="border-white/10 my-1" />
                                                    <button
                                                        onClick={() => { setDeleteConfirm(interview.id); setOpenMenu(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />Delete
                                                    </button>
                                                </div>
                                            )}
                                            {/* Delete Confirmation */}
                                            {deleteConfirm === interview.id && (
                                                <div className="absolute right-0 top-full mt-1 w-64 glass rounded-xl border border-red-500/30 shadow-glass z-20 p-4" onClick={(e) => e.stopPropagation()}>
                                                    <p className="text-sm text-text-primary font-medium mb-1">Delete this interview?</p>
                                                    <p className="text-xs text-text-muted mb-3">This will permanently remove it from both recruiter and student side.</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="flex-1 px-3 py-1.5 text-xs rounded-lg glass border border-white/10 text-text-secondary hover:bg-white/5 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(interview.id)}
                                                            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="text-center py-16 text-text-muted">
                                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>{interviews.length === 0 ? "No interviews yet" : "No interviews found"}</p>
                                <Link href="/recruiter/interviews/create">
                                    <Button variant="primary" size="sm" className="mt-4">Create your first interview</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
