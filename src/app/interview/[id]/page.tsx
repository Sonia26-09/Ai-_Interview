"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
    Brain, Clock, Shield, AlertTriangle, CheckCircle, Users,
    BarChart3, Play, ArrowLeft, Code2, Mic, Target, Building2, PauseCircle, Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { mockInterviews, practiceTemplates } from "@/lib/mock-data";
import { formatDuration } from "@/lib/utils";

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
    recruiterName?: string;
}

export default function InterviewStartPage() {
    const params = useParams();
    const id = params.id as string;

    const [dbInterview, setDbInterview] = useState<InterviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [userName, setUserName] = useState("Student");

    // Check if it's a practice template or mock interview (non-DB)
    const template = practiceTemplates.find(t => t.id === id);
    const mockInterview = mockInterviews.find(i => i.id === id);
    const isStaticContent = !!(template || mockInterview);

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

        // If it's a static template/mock, don't fetch from DB
        if (isStaticContent) {
            setIsLoading(false);
            return;
        }

        // Fetch from DB (public access for students)
        async function fetchInterview() {
            try {
                const res = await fetch(`/api/interviews/${id}?public=true`);
                if (res.ok) {
                    const data = await res.json();
                    setDbInterview(data.interview);
                    if (data.interview.status === "paused") {
                        setIsPaused(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch interview:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInterview();
    }, [id, isStaticContent]);

    // Loading state for DB interviews
    if (isLoading && !isStaticContent) {
        return (
            <div className="min-h-screen">
                <Navbar role="student" userName={userName} />
                <div className="max-w-3xl mx-auto px-4 py-10">
                    <div className="animate-pulse space-y-5">
                        <div className="h-4 w-32 bg-white/5 rounded" />
                        <div className="glass rounded-2xl border border-white/8 p-8 space-y-4">
                            <div className="h-8 w-64 bg-white/5 rounded-lg" />
                            <div className="h-4 w-96 bg-white/5 rounded" />
                            <div className="h-20 w-full bg-white/5 rounded-lg" />
                        </div>
                        <div className="glass rounded-2xl border border-white/8 p-6 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-white/5 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Determine data source
    let title: string, company: string, description: string, difficulty: string;
    let rounds: InterviewRound[];
    let showAntiCheat = false;
    let isFromDB = false;

    if (dbInterview) {
        // DB interview (recruiter created)
        title = dbInterview.title;
        company = dbInterview.company || dbInterview.recruiterName || "Company";
        description = dbInterview.description || "Interview created by recruiter.";
        difficulty = dbInterview.difficulty;
        rounds = dbInterview.rounds;
        showAntiCheat = dbInterview.antiCheat;
        isFromDB = true;
    } else if (mockInterview) {
        // Mock interview (from mock-data)
        title = mockInterview.title;
        company = mockInterview.company;
        description = mockInterview.description;
        difficulty = mockInterview.difficulty;
        rounds = mockInterview.rounds as InterviewRound[];
        showAntiCheat = mockInterview.antiCheat;
    } else if (template) {
        // Practice template
        title = template.title;
        company = template.company;
        description = template.description;
        difficulty = template.difficulty;
        rounds = [
            { id: "r1", type: "aptitude" as const, title: "Aptitude Round", duration: 30, difficulty: "Medium", questionCount: 25, isRequired: true, order: 1 },
            { id: "r2", type: "coding" as const, title: "Coding Round", duration: 60, difficulty: "Medium", questionCount: 3, isRequired: true, order: 2 },
            { id: "r3", type: "hr" as const, title: "HR Round", duration: 30, difficulty: "Easy", questionCount: 6, isRequired: false, order: 3 },
        ];
    } else {
        // Not found
        return (
            <div className="min-h-screen">
                <Navbar role="student" userName={userName} />
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-30" />
                    <h1 className="text-2xl font-bold font-display mb-2">Interview Not Found</h1>
                    <p className="text-text-muted mb-6">This interview doesn't exist or has been removed.</p>
                    <Link href="/student/practice">
                        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            Back to Practice
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const totalDuration = rounds.reduce((a, r) => a + r.duration, 0);

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName={userName} />
            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Back */}
                <Link href="/student/practice" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-6 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />Back to Practice
                </Link>

                {/* ═══ Paused Banner ═══════════════════════════════════════════ */}
                {isPaused && (
                    <div className="glass rounded-2xl border border-orange-400/30 p-6 mb-5 bg-orange-400/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center flex-shrink-0">
                                <PauseCircle className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-orange-400 text-lg mb-1">This interview is no longer accepting responses</h2>
                                <p className="text-sm text-text-muted">The recruiter has paused this interview. Please check back later or explore other interviews.</p>
                            </div>
                        </div>
                        <Link href="/student/practice" className="block mt-4">
                            <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                                Browse Other Interviews
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Header */}
                <div className={`glass rounded-2xl border border-white/10 p-8 mb-5 ${isPaused ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Badge variant="cyan">{company}</Badge>
                        <Badge variant={difficulty === "Hard" ? "red" : difficulty === "Medium" ? "yellow" : "green"}>{difficulty}</Badge>
                        {isFromDB && (
                            <Badge variant="default" size="sm">
                                <Building2 className="w-3 h-3 mr-1 inline" />Company Interview
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold font-display mb-2">{title}</h1>
                    <p className="text-text-secondary">{description}</p>

                    <div className="flex flex-wrap gap-5 mt-6 text-sm">
                        <div className="flex items-center gap-2 text-text-muted">
                            <Clock className="w-4 h-4 text-neon-cyan" />{formatDuration(totalDuration)} total
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <Brain className="w-4 h-4 text-neon-purple" />{rounds.length} rounds
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <BarChart3 className="w-4 h-4 text-neon-green" />AI scoring & feedback
                        </div>
                        {showAntiCheat && (
                            <div className="flex items-center gap-2 text-text-muted">
                                <Shield className="w-4 h-4 text-orange-400" />Anti-cheat enabled
                            </div>
                        )}
                    </div>
                </div>

                {/* Rounds */}
                <div className={`glass rounded-2xl border border-white/10 p-6 mb-5 ${isPaused ? "opacity-60" : ""}`}>
                    <h2 className="font-semibold text-text-primary mb-4">Interview Rounds</h2>
                    <div className="space-y-3">
                        {rounds.map((round, i) => {
                            const icons: Record<string, any> = { aptitude: Target, coding: Code2, hr: Mic };
                            const colors: Record<string, string> = { aptitude: "blue", coding: "cyan", hr: "purple" };
                            const Icon = icons[round.type];
                            const color = colors[round.type];
                            return (
                                <div key={round.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/3 border border-white/8">
                                    <div className={`w-9 h-9 rounded-xl bg-neon-${color}/10 border border-neon-${color}/20 flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-4.5 h-4.5 text-neon-${color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-text-primary">{round.title}</span>
                                            {!round.isRequired && <Badge variant="default" size="sm">Optional</Badge>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                                            <span>{round.duration} min</span>
                                            <span>{round.questionCount} questions</span>
                                            <span>{round.difficulty}</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold text-text-muted`}>
                                        {i + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Anti-cheat consent */}
                {!isPaused && (
                    <div className="glass rounded-2xl border border-orange-400/20 p-5 mb-6 bg-orange-400/5">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-orange-400 text-sm mb-1">Before you start</div>
                                <ul className="text-xs text-text-muted space-y-1">
                                    <li>• Do not switch tabs or minimize the window — it will trigger warnings</li>
                                    <li>• Each round has an individual timer — it starts when you click "Begin"</li>
                                    <li>• You can pause between rounds but not within them</li>
                                    <li>• AI will score each answer in real-time and generate a full report at the end</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start / Disabled */}
                {isPaused ? (
                    <Button variant="secondary" size="xl" className="w-full opacity-50 cursor-not-allowed" disabled leftIcon={<PauseCircle className="w-5 h-5" />}>
                        Interview Paused — Not Accepting Responses
                    </Button>
                ) : (
                    <Link href={`/interview/${id}/aptitude`}>
                        <Button variant="primary" size="xl" className="w-full" leftIcon={<Play className="w-5 h-5" />}>
                            Begin Interview
                        </Button>
                    </Link>
                )}
                {!isPaused && (
                    <p className="text-center text-xs text-text-muted mt-3">By starting, you agree to fair assessment practices</p>
                )}
            </div>
        </div>
    );
}
