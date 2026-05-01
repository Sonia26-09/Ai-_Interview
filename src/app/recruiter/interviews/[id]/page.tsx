"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
    ArrowLeft, Brain, Clock, Users, Calendar, Shield, Target,
    Code2, Mic, BarChart3, Settings, Edit3, Trash2, Copy,
    Building2, CheckCircle, Share2, Eye, ChevronRight
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils";

interface InterviewRound {
    id: string;
    type: "aptitude" | "coding" | "hr";
    title: string;
    duration: number;
    difficulty: string;
    questionCount: number;
    techStack?: string[];
    isRequired: boolean;
    order: number;
}

interface InterviewDetail {
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

export default function RecruiterInterviewDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [interview, setInterview] = useState<InterviewDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState("Recruiter");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchData() {
            // Fetch user
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

            // Fetch interview by ID
            try {
                const res = await fetch(`/api/interviews/${id}`);
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setError(data.error || "Interview not found");
                    setIsLoading(false);
                    return;
                }
                const data = await res.json();
                setInterview(data.interview);
            } catch (err) {
                console.error("Failed to fetch interview:", err);
                setError("Failed to load interview details");
            } finally {
                setIsLoading(false);
            }
        }

        if (id) fetchData();
    }, [id]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const roundIcons = { aptitude: Target, coding: Code2, hr: Mic };
    const roundColors = { aptitude: "blue", coding: "cyan", hr: "purple" };

    // ── Loading Skeleton ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar role="recruiter" userName={userName} />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 w-32 bg-white/5 rounded" />
                        <div className="glass rounded-2xl border border-white/8 p-8 space-y-4">
                            <div className="h-8 w-96 bg-white/5 rounded-lg" />
                            <div className="h-4 w-72 bg-white/5 rounded" />
                            <div className="h-20 w-full bg-white/5 rounded-lg" />
                        </div>
                        <div className="glass rounded-2xl border border-white/8 p-6 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-white/5 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error / Not Found ─────────────────────────────────────────────
    if (error || !interview) {
        return (
            <div className="min-h-screen">
                <Navbar role="recruiter" userName={userName} />
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-30" />
                    <h1 className="text-2xl font-bold font-display mb-2">Interview Not Found</h1>
                    <p className="text-text-muted mb-6">{error || "This interview doesn't exist or you don't have access to it."}</p>
                    <Link href="/recruiter/interviews">
                        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            Back to Interviews
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const totalDuration = interview.rounds.reduce((a, r) => a + r.duration, 0);
    const totalQuestions = interview.rounds.reduce((a, r) => a + r.questionCount, 0);

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={userName} />

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Link href="/recruiter/interviews" className="hover:text-text-secondary flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />Interviews
                    </Link>
                    <span>/</span>
                    <span className="text-text-primary truncate max-w-[300px]">{interview.title}</span>
                </div>

                {/* Header Card */}
                <div className="glass rounded-2xl border border-white/10 p-8 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant={interview.status === "active" ? "green" : interview.status === "draft" ? "yellow" : "default"} dot>
                                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                </Badge>
                                <Badge variant={interview.difficulty === "Hard" ? "red" : interview.difficulty === "Medium" ? "yellow" : "green"}>
                                    {interview.difficulty}
                                </Badge>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">{interview.title}</h1>
                            {interview.role && (
                                <p className="text-text-secondary text-sm mb-3">Role: {interview.role}</p>
                            )}
                            {interview.description && (
                                <p className="text-text-muted text-sm leading-relaxed">{interview.description}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={handleCopyLink}
                                leftIcon={copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}>
                                {copied ? "Copied!" : "Share"}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-5 mt-6 pt-6 border-t border-white/8 text-sm">
                        <div className="flex items-center gap-2 text-text-muted">
                            <Users className="w-4 h-4 text-neon-cyan" />
                            <span><strong className="text-text-primary">{interview.applicants}</strong> applicants</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <Brain className="w-4 h-4 text-neon-purple" />
                            <span><strong className="text-text-primary">{interview.rounds.length}</strong> rounds</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <Clock className="w-4 h-4 text-neon-green" />
                            <span><strong className="text-text-primary">{formatDuration(totalDuration)}</strong> total</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <BarChart3 className="w-4 h-4 text-yellow-400" />
                            <span>Passing: <strong className="text-text-primary">{interview.passingScore}%</strong></span>
                        </div>
                        {interview.deadline && (
                            <div className="flex items-center gap-2 text-text-muted">
                                <Calendar className="w-4 h-4 text-orange-400" />
                                <span>Due {new Date(interview.deadline).toLocaleDateString()}</span>
                            </div>
                        )}
                        {interview.antiCheat && (
                            <div className="flex items-center gap-2 text-text-muted">
                                <Shield className="w-4 h-4 text-orange-400" />
                                <span>Anti-cheat enabled</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-5">
                    {/* Rounds Section */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-2xl border border-white/10 p-6">
                            <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Brain className="w-4.5 h-4.5 text-neon-purple" />
                                Interview Rounds
                            </h2>

                            {interview.rounds.length === 0 ? (
                                <div className="text-center py-10 text-text-muted">
                                    <Brain className="w-10 h-10 mx-auto mb-3 opacity-25" />
                                    <p className="text-sm">No rounds configured for this interview</p>
                                    <p className="text-xs text-text-muted/60 mt-1">Edit this interview to add rounds</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {interview.rounds.map((round, i) => {
                                        const Icon = roundIcons[round.type] || Target;
                                        const color = roundColors[round.type] || "cyan";
                                        return (
                                            <Link key={round.id} href={`/recruiter/interviews/${id}/rounds/${round.id}`}>
                                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/8 hover:border-neon-cyan/30 hover:bg-white/5 transition-all cursor-pointer group">
                                                    <div className={`w-10 h-10 rounded-xl bg-neon-${color}/10 border border-neon-${color}/20 flex items-center justify-center flex-shrink-0`}>
                                                        <Icon className={`w-5 h-5 text-neon-${color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm text-text-primary group-hover:text-neon-cyan transition-colors">{round.title}</span>
                                                            {!round.isRequired && <Badge variant="default" size="sm">Optional</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{round.duration} min</span>
                                                            <span>{round.questionCount} questions</span>
                                                            <Badge variant={round.difficulty === "Hard" ? "red" : round.difficulty === "Medium" ? "yellow" : "green"} size="sm">
                                                                {round.difficulty}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-full border-2 border-white/15 flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-neon-cyan group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Tech Stack */}
                        {interview.techStack.length > 0 && (
                            <div className="glass rounded-2xl border border-white/10 p-5">
                                <h3 className="font-semibold text-text-primary text-sm mb-3">Tech Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                    {interview.techStack.map((tech) => (
                                        <span key={tech} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="glass rounded-2xl border border-white/10 p-5">
                            <h3 className="font-semibold text-text-primary text-sm mb-3">Summary</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Total Questions</span>
                                    <span className="font-semibold text-text-primary">{totalQuestions}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Total Duration</span>
                                    <span className="font-semibold text-text-primary">{formatDuration(totalDuration)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Passing Score</span>
                                    <span className="font-semibold text-text-primary">{interview.passingScore}%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Anti-Cheat</span>
                                    <span className={`font-semibold ${interview.antiCheat ? "text-neon-green" : "text-text-muted"}`}>
                                        {interview.antiCheat ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                                <hr className="border-white/8" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Created</span>
                                    <span className="text-text-secondary">{new Date(interview.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
