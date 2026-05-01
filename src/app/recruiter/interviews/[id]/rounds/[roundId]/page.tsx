"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
    ArrowLeft, Brain, Clock, Target, Code2, Mic, Save,
    ChevronRight, ChevronDown, AlertCircle, CheckCircle, Sparkles,
    Hash, Timer, BarChart3, Shield, Settings, Loader2,
    Bot, User2, Eye, EyeOff, ListOrdered
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { formatDuration } from "@/lib/utils";

interface RoundData {
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

interface InterviewData {
    id: string;
    title: string;
    role: string;
    rounds: RoundData[];
    passingScore: number;
    techStack: string[];
    difficulty: string;
}

interface QuestionData {
    id: string;
    type: string;
    title: string;
    description: string;
    difficulty: string;
    options?: string[];
    correctOption?: number;
    starterCode?: Record<string, string>;
    functionName?: string;
    expectedAnswer?: string;
    tags: string[];
    points: number;
    order: number;
    isAIGenerated: boolean;
}

const ROUND_META: Record<string, { icon: any; color: string; label: string; description: string }> = {
    aptitude: {
        icon: Target,
        color: "blue",
        label: "Aptitude Round",
        description: "MCQ-based reasoning, logic & quantitative aptitude questions",
    },
    coding: {
        icon: Code2,
        color: "cyan",
        label: "Coding Round",
        description: "DSA + tech stack coding challenges with test cases",
    },
    hr: {
        icon: Mic,
        color: "purple",
        label: "HR / Behavioral Round",
        description: "Behavioral & situational questions with AI-powered interview",
    },
};

const SAMPLE_TOPICS: Record<string, string[]> = {
    aptitude: [
        "Logical Reasoning", "Quantitative Aptitude", "Verbal Ability",
        "Data Interpretation", "Pattern Recognition", "Problem Solving",
    ],
    coding: [
        "Arrays & Strings", "Data Structures", "Algorithms",
        "REST APIs", "SQL Queries", "System Design",
    ],
    hr: [
        "Tell me about yourself", "Why do you want to join us?",
        "Strengths & Weaknesses", "Conflict Resolution",
        "Team Collaboration", "Salary Expectations",
    ],
};

export default function RoundDetailPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;
    const roundId = params.roundId as string;

    const [interview, setInterview] = useState<InterviewData | null>(null);
    const [round, setRound] = useState<RoundData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [userName, setUserName] = useState("Recruiter");
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(true);
    const [expandedQ, setExpandedQ] = useState<string | null>(null);
    const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

    // Editable fields
    const [editTitle, setEditTitle] = useState("");
    const [editDuration, setEditDuration] = useState(30);
    const [editQuestionCount, setEditQuestionCount] = useState(10);
    const [editDifficulty, setEditDifficulty] = useState("Medium");
    const [editRequired, setEditRequired] = useState(true);

    useEffect(() => {
        async function fetchData() {
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

            try {
                const res = await fetch(`/api/interviews/${interviewId}`);
                if (!res.ok) {
                    setError("Interview not found");
                    setIsLoading(false);
                    return;
                }
                const data = await res.json();
                const interviewData = data.interview;
                setInterview(interviewData);

                const foundRound = interviewData.rounds.find((r: RoundData) => r.id === roundId);
                if (!foundRound) {
                    setError("Round not found in this interview");
                    setIsLoading(false);
                    return;
                }

                setRound(foundRound);
                setEditTitle(foundRound.title);
                setEditDuration(foundRound.duration);
                setEditQuestionCount(foundRound.questionCount);
                setEditDifficulty(foundRound.difficulty);
                setEditRequired(foundRound.isRequired);

                // Fetch questions for this round
                try {
                    const qRes = await fetch(`/api/interviews/${interviewId}/rounds/${roundId}/questions`);
                    if (qRes.ok) {
                        const qData = await qRes.json();
                        setQuestions(qData.questions || []);
                    }
                } catch (qErr) {
                    console.error("Failed to fetch questions:", qErr);
                } finally {
                    setQuestionsLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch round:", err);
                setError("Failed to load round details");
            } finally {
                setIsLoading(false);
            }
        }

        if (interviewId && roundId) fetchData();
    }, [interviewId, roundId]);

    const handleSave = async () => {
        if (!interview || !round) return;

        setIsSaving(true);
        setSaveMessage(null);

        // Build updated rounds array — update only this round
        const updatedRounds = interview.rounds.map((r) => {
            if (r.id === roundId) {
                return {
                    ...r,
                    title: editTitle.trim() || r.title,
                    duration: editDuration,
                    questionCount: editQuestionCount,
                    difficulty: editDifficulty,
                    isRequired: editRequired,
                };
            }
            return r;
        });

        try {
            const res = await fetch(`/api/interviews/${interviewId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rounds: updatedRounds }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setSaveMessage(data.error || "Failed to save changes");
                setIsSaving(false);
                return;
            }

            setSaveMessage("Changes saved successfully!");
            // Update local state
            setRound({
                ...round,
                title: editTitle.trim() || round.title,
                duration: editDuration,
                questionCount: editQuestionCount,
                difficulty: editDifficulty,
                isRequired: editRequired,
            });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch {
            setSaveMessage("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges =
        round &&
        (editTitle !== round.title ||
            editDuration !== round.duration ||
            editQuestionCount !== round.questionCount ||
            editDifficulty !== round.difficulty ||
            editRequired !== round.isRequired);

    // ── Loading ───────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar role="recruiter" userName={userName} />
                <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 w-48 bg-white/5 rounded" />
                        <div className="glass rounded-2xl border border-white/8 p-8 space-y-4">
                            <div className="h-8 w-64 bg-white/5 rounded-lg" />
                            <div className="h-4 w-96 bg-white/5 rounded" />
                        </div>
                        <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-12 bg-white/5 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────
    if (error || !round || !interview) {
        return (
            <div className="min-h-screen">
                <Navbar role="recruiter" userName={userName} />
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400 opacity-50" />
                    <h1 className="text-2xl font-bold font-display mb-2">Round Not Found</h1>
                    <p className="text-text-muted mb-6">{error || "This round doesn't exist."}</p>
                    <Link href={`/recruiter/interviews/${interviewId}`}>
                        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            Back to Interview
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const meta = ROUND_META[round.type] || ROUND_META.aptitude;
    const Icon = meta.icon;
    const topics = SAMPLE_TOPICS[round.type] || [];

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={userName} />

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6 flex-wrap">
                    <Link href="/recruiter/interviews" className="hover:text-text-secondary transition-colors">
                        Interviews
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/recruiter/interviews/${interviewId}`} className="hover:text-text-secondary transition-colors truncate max-w-[200px]">
                        {interview.title}
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-text-primary">{round.title}</span>
                </div>

                {/* Round Header */}
                <div className={`glass rounded-2xl border border-neon-${meta.color}/20 p-8 mb-6`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-neon-${meta.color}/10 border border-neon-${meta.color}/20 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-7 h-7 text-neon-${meta.color}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant={meta.color === "blue" ? "blue" : meta.color === "cyan" ? "cyan" : "purple"}>
                                    Round {round.order}
                                </Badge>
                                <Badge variant={round.difficulty === "Hard" ? "red" : round.difficulty === "Medium" ? "yellow" : "green"}>
                                    {round.difficulty}
                                </Badge>
                                {!round.isRequired && <Badge variant="default">Optional</Badge>}
                            </div>
                            <h1 className="text-2xl font-bold font-display mb-1">{round.title}</h1>
                            <p className="text-text-muted text-sm">{meta.description}</p>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-muted">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-neon-green" />{round.duration} min
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Hash className="w-4 h-4 text-neon-cyan" />{round.questionCount} questions
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <BarChart3 className="w-4 h-4 text-yellow-400" />Pass: {interview.passingScore}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Round Settings — Editable */}
                <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
                    <h2 className="font-semibold text-text-primary mb-5 flex items-center gap-2">
                        <Settings className="w-4.5 h-4.5 text-text-muted" />
                        Round Configuration
                    </h2>

                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Round Title</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Duration (minutes)</label>
                                <input
                                    type="number"
                                    min={5}
                                    max={180}
                                    value={editDuration}
                                    onChange={(e) => setEditDuration(parseInt(e.target.value) || 30)}
                                    className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10"
                                />
                            </div>

                            {/* Question Count */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Number of Questions</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={editQuestionCount}
                                    onChange={(e) => setEditQuestionCount(parseInt(e.target.value) || 10)}
                                    className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10"
                                />
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Difficulty</label>
                            <div className="flex gap-2">
                                {(["Easy", "Medium", "Hard"] as const).map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setEditDifficulty(d)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${editDifficulty === d
                                            ? d === "Easy" ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                                                : d === "Medium" ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-300"
                                                    : "bg-red-400/10 border-red-400/40 text-red-400"
                                            : "glass border-white/10 text-text-muted hover:border-white/20"
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Required Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
                            <div>
                                <div className="text-sm font-medium text-text-primary">Required Round</div>
                                <div className="text-xs text-text-muted mt-0.5">Candidates must complete this round</div>
                            </div>
                            <button
                                onClick={() => setEditRequired(!editRequired)}
                                className={`w-11 h-6 rounded-full transition-all relative ${editRequired ? "bg-neon-cyan" : "bg-white/10"}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${editRequired ? "left-6" : "left-1"}`} />
                            </button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex items-center justify-between">
                        <div>
                            {saveMessage && (
                                <div className={`flex items-center gap-2 text-sm ${saveMessage.includes("success") ? "text-neon-green" : "text-red-400"}`}>
                                    {saveMessage.includes("success") ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {saveMessage}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="primary"
                            size="md"
                            disabled={!hasChanges || isSaving}
                            isLoading={isSaving}
                            onClick={handleSave}
                            leftIcon={!isSaving ? <Save className="w-4 h-4" /> : undefined}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* ─── Questions Section ────────────────────────────── */}
                <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-text-primary flex items-center gap-2">
                            <ListOrdered className="w-4.5 h-4.5 text-neon-cyan" />
                            Questions ({questions.length})
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{questions.filter(q => !q.isAIGenerated).length} Manual</span>
                            <span className="flex items-center gap-1"><Bot className="w-3 h-3" />{questions.filter(q => q.isAIGenerated).length} AI Generated</span>
                        </div>
                    </div>

                    {questionsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-10 text-text-muted">
                            <Brain className="w-10 h-10 mx-auto mb-3 opacity-25" />
                            <p className="text-sm">No questions added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {questions.map((q, qi) => {
                                const isExpanded = expandedQ === q.id;
                                return (
                                    <div key={q.id} className={`rounded-xl border transition-all ${
                                        isExpanded ? "border-neon-cyan/30 bg-white/5" : "border-white/8 bg-white/2 hover:border-white/15"
                                    }`}>
                                        {/* Question Header — clickable */}
                                        <button
                                            onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                                            className="w-full flex items-center gap-3 p-4 text-left"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                                                {qi + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-text-primary truncate">{q.title}</span>
                                                    <Badge variant={q.isAIGenerated ? "cyan" : "purple"} size="sm">
                                                        {q.isAIGenerated ? "AI" : "Manual"}
                                                    </Badge>
                                                    <Badge variant={q.difficulty === "Hard" ? "red" : q.difficulty === "Medium" ? "yellow" : "green"} size="sm">
                                                        {q.difficulty}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-text-muted mt-0.5 truncate">{q.description.slice(0, 80)}{q.description.length > 80 ? "..." : ""}</p>
                                            </div>
                                            <span className="text-xs text-text-muted flex-shrink-0">{q.points} pts</span>
                                            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                                        </button>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 border-t border-white/8">
                                                <div className="mt-4">
                                                    {/* Question Text */}
                                                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed mb-4">{q.description}</p>

                                                    {/* Tags */}
                                                    {q.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                                            {q.tags.map((tag) => (
                                                                <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-white/5 border border-white/10 text-text-muted">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* MCQ Options (Aptitude) */}
                                                    {q.type === "aptitude" && q.options && q.options.length > 0 && (
                                                        <div className="space-y-2 mb-4">
                                                            <p className="text-xs font-medium text-text-muted mb-2">Options:</p>
                                                            {q.options.map((opt, oi) => (
                                                                <div
                                                                    key={oi}
                                                                    className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                                                                        showAnswer[q.id] && oi === q.correctOption
                                                                            ? "border-neon-green/40 bg-neon-green/10 text-neon-green"
                                                                            : "border-white/8 bg-white/3 text-text-secondary"
                                                                    }`}
                                                                >
                                                                    <span className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                                                                        {String.fromCharCode(65 + oi)}
                                                                    </span>
                                                                    {opt}
                                                                    {showAnswer[q.id] && oi === q.correctOption && (
                                                                        <CheckCircle className="w-4 h-4 ml-auto text-neon-green flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => setShowAnswer(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                                                className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors mt-2"
                                                            >
                                                                {showAnswer[q.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                {showAnswer[q.id] ? "Hide Answer" : "Show Answer"}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Coding — Starter Code */}
                                                    {q.type === "coding" && q.starterCode && (
                                                        <div className="mb-4">
                                                            <p className="text-xs font-medium text-text-muted mb-2">Starter Code:</p>
                                                            {Object.entries(q.starterCode).map(([lang, code]) => (
                                                                <div key={lang} className="rounded-lg overflow-hidden border border-white/10">
                                                                    <div className="bg-white/5 px-3 py-1.5 text-xs font-medium text-text-muted border-b border-white/10 capitalize">{lang}</div>
                                                                    <pre className="p-3 text-xs text-neon-cyan/90 overflow-x-auto bg-black/30"><code>{code}</code></pre>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* HR — Expected Answer */}
                                                    {q.type === "hr" && q.expectedAnswer && (
                                                        <div className="mb-4">
                                                            <button
                                                                onClick={() => setShowAnswer(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                                                className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors mb-2"
                                                            >
                                                                {showAnswer[q.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                {showAnswer[q.id] ? "Hide Evaluation Criteria" : "Show Evaluation Criteria"}
                                                            </button>
                                                            {showAnswer[q.id] && (
                                                                <div className="p-3 rounded-lg bg-neon-purple/5 border border-neon-purple/20 text-xs text-text-secondary leading-relaxed">
                                                                    {q.expectedAnswer}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <Link href={`/recruiter/interviews/${interviewId}`}>
                    <Button variant="secondary" size="lg" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                        Back to Interview
                    </Button>
                </Link>
            </main>
        </div>
    );
}
