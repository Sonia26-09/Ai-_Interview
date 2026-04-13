"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Clock, ChevronLeft, ChevronRight, Brain, CheckCircle2,
    AlertTriangle, Flag, ArrowRight, ChevronDown, ChevronUp,
    Lightbulb, XCircle, BookOpen
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Navbar from "@/components/layout/Navbar";
import { mockAptitudeQuestions } from "@/lib/mock-data";
import { formatTime } from "@/lib/utils";
import { buildAptitudeResult, saveToStorage, STORAGE_KEYS } from "@/lib/ai-feedback";
import type { QuestionFeedback } from "@/lib/types";

export default function AptitudeRoundPage() {
    const params = useParams();
    const TOTAL_TIME = 30 * 60;
    const questions = mockAptitudeQuestions;

    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<(number | null)[]>(new Array(questions.length).fill(null));
    const [flagged, setFlagged] = useState<boolean[]>(new Array(questions.length).fill(false));
    const [submitted, setSubmitted] = useState(false);
    const [tabWarnings, setTabWarnings] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [feedbacks, setFeedbacks] = useState<QuestionFeedback[]>([]);
    const [expandedQ, setExpandedQ] = useState<number | null>(0);
    const [isGenerating, setIsGenerating] = useState(false);

    // Timer
    useEffect(() => {
        if (submitted) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { handleSubmit(); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted]);

    // Anti-cheat
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && !submitted) {
                setTabWarnings(w => w + 1);
                setShowWarning(true);
                setTimeout(() => setShowWarning(false), 3000);
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [submitted]);

    const handleSelect = (optionIdx: number) => {
        if (submitted) return;
        const newSelected = [...selected];
        newSelected[currentQ] = optionIdx;
        setSelected(newSelected);
    };

    const toggleFlag = () => {
        const newFlagged = [...flagged];
        newFlagged[currentQ] = !newFlagged[currentQ];
        setFlagged(newFlagged);
    };

    const handleSubmit = async () => {
        setIsGenerating(true);
        // Simulate AI processing
        await new Promise(r => setTimeout(r, 1800));
        const timeTaken = TOTAL_TIME - timeLeft;
        const result = buildAptitudeResult(questions, selected, timeTaken);
        saveToStorage(STORAGE_KEYS.aptitude, result);
        setFeedbacks(result.feedbacks);
        setIsGenerating(false);
        setSubmitted(true);
    };

    const answeredCount = selected.filter(s => s !== null).length;
    const flaggedCount = flagged.filter(Boolean).length;
    const timePercent = (timeLeft / TOTAL_TIME) * 100;
    const isLowTime = timeLeft < 300;

    const q = questions[currentQ];
    const score = submitted
        ? questions.reduce((acc, q, i) => acc + (selected[i] === q.correctOption ? q.points : 0), 0)
        : 0;

    // ─── AI Generating Screen ─────────────────────────────────────────────────
    if (isGenerating) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Navbar role="student" userName="Siddhi Gupta" />
                <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Brain className="w-10 h-10 text-background" />
                    </div>
                    <h2 className="text-2xl font-bold font-display mb-2">AI is Analysing Your Answers</h2>
                    <p className="text-text-muted text-sm">Generating personalised feedback for each question...</p>
                    <div className="flex justify-center gap-1.5 mt-6">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2.5 h-2.5 rounded-full bg-neon-purple animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Submitted / Feedback Screen ─────────────────────────────────────────
    if (submitted) {
        const totalPoints = questions.reduce((a, q) => a + q.points, 0);
        const percent = Math.round((score / totalPoints) * 100);
        const correctCount = feedbacks.filter(f => f.isCorrect).length;

        return (
            <div className="min-h-screen">
                <Navbar role="student" userName="Siddhi Gupta" />
                <div className="max-w-3xl mx-auto px-4 py-8">
                    {/* Score Hero */}
                    <div className={`glass rounded-3xl border p-8 mb-6 text-center relative overflow-hidden ${percent >= 70 ? "border-neon-green/30 bg-neon-green/5" : "border-red-500/30 bg-red-500/5"}`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5" />
                        <div className="relative">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${percent >= 70 ? "bg-neon-green/20 border-2 border-neon-green/40" : "bg-red-500/20 border-2 border-red-500/40"}`}>
                                {percent >= 70
                                    ? <CheckCircle2 className="w-8 h-8 text-neon-green" />
                                    : <AlertTriangle className="w-8 h-8 text-red-400" />}
                            </div>
                            <h1 className="text-3xl font-bold font-display mb-1">Aptitude Round Complete!</h1>
                            <p className="text-text-muted mb-5 text-sm">AI Feedback Generated</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <div>
                                    <div className={`text-4xl font-bold font-display mb-1 ${percent >= 70 ? "text-neon-green" : "text-red-400"}`}>{percent}%</div>
                                    <div className="text-xs text-text-muted">Score</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold font-display mb-1 text-neon-cyan">{correctCount}/{questions.length}</div>
                                    <div className="text-xs text-text-muted">Correct</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold font-display mb-1 text-neon-purple">{score}/{totalPoints}</div>
                                    <div className="text-xs text-text-muted">Points</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {tabWarnings > 0 && (
                        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                            ⚠️ {tabWarnings} tab switch warning(s) recorded
                        </div>
                    )}

                    {/* AI Feedback header */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                            <Brain className="w-3.5 h-3.5 text-background" />
                        </div>
                        <h2 className="font-semibold text-text-primary">Question-by-Question AI Feedback</h2>
                        <Badge variant="purple" size="sm">AI Generated</Badge>
                    </div>

                    {/* Per-question feedback accordion */}
                    <div className="space-y-3 mb-6">
                        {questions.map((q, i) => {
                            const fb = feedbacks[i];
                            const isExpanded = expandedQ === i;
                            if (!fb) return null;
                            return (
                                <div key={q.id}
                                    className={`glass rounded-2xl border transition-all duration-200 overflow-hidden ${fb.isCorrect
                                        ? "border-neon-green/25 bg-neon-green/3"
                                        : "border-red-500/25 bg-red-500/3"
                                        }`}>
                                    {/* Header row */}
                                    <button
                                        className="w-full flex items-center gap-3 p-4 text-left"
                                        onClick={() => setExpandedQ(isExpanded ? null : i)}>
                                        {/* Status icon */}
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${fb.isCorrect
                                            ? "bg-neon-green/15 border border-neon-green/30"
                                            : "bg-red-500/15 border border-red-500/30"
                                            }`}>
                                            {fb.isCorrect
                                                ? <CheckCircle2 className="w-4 h-4 text-neon-green" />
                                                : <XCircle className="w-4 h-4 text-red-400" />}
                                        </div>

                                        {/* Question number + preview */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-semibold text-text-muted">Q{i + 1}</span>
                                                <Badge variant={q.difficulty === "Easy" ? "green" : q.difficulty === "Medium" ? "yellow" : "red"} size="sm">
                                                    {q.difficulty}
                                                </Badge>
                                                <span className="text-xs text-text-muted">{q.points} pts</span>
                                                {fb.isCorrect && <span className="text-xs font-semibold text-neon-green">+{q.points} earned</span>}
                                            </div>
                                            <p className="text-sm text-text-primary truncate pr-4">{q.description}</p>
                                        </div>

                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
                                            : <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />}
                                    </button>

                                    {/* Expanded feedback */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-white/8 pt-4 space-y-4">
                                            {/* Options review */}
                                            <div>
                                                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Answer Review</div>
                                                <div className="space-y-2">
                                                    {q.options?.map((opt, oi) => {
                                                        const isCorrect = oi === fb.correctOption;
                                                        const isSelected = oi === fb.selectedOption;
                                                        const isWrong = isSelected && !isCorrect;
                                                        return (
                                                            <div key={oi}
                                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${isCorrect
                                                                    ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                                                                    : isWrong
                                                                        ? "bg-red-500/10 border-red-500/40 text-red-400 line-through"
                                                                        : "bg-white/3 border-white/8 text-text-muted"
                                                                    }`}>
                                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect
                                                                    ? "bg-neon-green border-neon-green text-background"
                                                                    : isWrong
                                                                        ? "bg-red-500 border-red-500 text-white"
                                                                        : "border-white/20 text-text-muted"
                                                                    }`}>
                                                                    {String.fromCharCode(65 + oi)}
                                                                </div>
                                                                <span className="flex-1">{opt}</span>
                                                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />}
                                                                {isWrong && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                                                                {isSelected && !isWrong && isCorrect && (
                                                                    <Badge variant="green" size="sm">Your Answer ✓</Badge>
                                                                )}
                                                                {isWrong && (
                                                                    <Badge variant="red" size="sm">Your Answer ✗</Badge>
                                                                )}
                                                                {!isSelected && isCorrect && (
                                                                    <Badge variant="green" size="sm">Correct Answer</Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {fb.selectedOption === null && (
                                                        <div className="text-xs text-text-muted italic">You did not answer this question.</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* AI Explanation */}
                                            <div className="p-4 rounded-xl bg-neon-purple/5 border border-neon-purple/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Brain className="w-3.5 h-3.5 text-neon-purple" />
                                                    <span className="text-xs font-semibold text-neon-purple uppercase tracking-wider">AI Explanation</span>
                                                </div>
                                                <p className="text-sm text-text-secondary leading-relaxed">{fb.explanation}</p>
                                            </div>

                                            {/* Quick Tip */}
                                            <div className="p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20 flex items-start gap-2.5">
                                                <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="text-xs font-semibold text-yellow-400 block mb-0.5">Quick Tip</span>
                                                    <p className="text-xs text-text-secondary leading-relaxed">{fb.tip}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3 justify-center">
                        <Link href={`/interview/${params.id}/coding`}>
                            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                Continue to Coding Round
                            </Button>
                        </Link>
                        <Link href="/student/dashboard">
                            <Button variant="secondary">Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Active Test UI ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="Siddhi Gupta" />

            {showWarning && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-red-500/90 text-white rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-up">
                    <AlertTriangle className="w-4 h-4" />
                    ⚠️ Tab switch detected! Warning {tabWarnings}/3
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-bold text-lg">Aptitude Round</h1>
                        <p className="text-xs text-text-muted">Question {currentQ + 1} of {questions.length}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 glass rounded-xl border ${isLowTime ? "border-red-500/40 bg-red-500/10" : "border-white/10"}`}>
                        <Clock className={`w-4 h-4 ${isLowTime ? "text-red-400 animate-pulse" : "text-neon-cyan"}`} />
                        <span className={`font-mono font-bold text-lg ${isLowTime ? "text-red-400" : "text-neon-cyan"}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${isLowTime ? "bg-red-400" : "bg-gradient-to-r from-neon-cyan to-neon-purple"}`}
                        style={{ width: `${timePercent}%` }} />
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Main question */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="glass rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant={q.difficulty === "Easy" ? "green" : q.difficulty === "Medium" ? "yellow" : "red"} size="sm">
                                    {q.difficulty}
                                </Badge>
                                <Badge variant="default" size="sm">{q.points} pts</Badge>
                                {flagged[currentQ] && <Badge variant="orange" size="sm">🚩 Flagged</Badge>}
                            </div>
                            <h2 className="font-semibold text-text-primary text-lg mb-6 leading-relaxed">{q.description}</h2>

                            <div className="space-y-3">
                                {q.options?.map((option, i) => {
                                    const isSelected = selected[currentQ] === i;
                                    return (
                                        <button key={i} onClick={() => handleSelect(i)}
                                            className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 group flex items-center gap-3 ${isSelected
                                                ? "bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan shadow-neon-cyan"
                                                : "glass border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary"
                                                }`}>
                                            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${isSelected ? "bg-neon-cyan border-neon-cyan text-background" : "border-white/20 text-text-muted"}`}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className="text-sm">{option}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action bar */}
                        <div className="flex items-center justify-between">
                            <Button variant="secondary" size="md" disabled={currentQ === 0}
                                onClick={() => setCurrentQ(q => q - 1)} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                                Previous
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="md" onClick={toggleFlag} leftIcon={<Flag className="w-4 h-4" />}>
                                    {flagged[currentQ] ? "Unflag" : "Flag"}
                                </Button>
                                {currentQ < questions.length - 1 ? (
                                    <Button variant="primary" size="md" onClick={() => setCurrentQ(q => q + 1)}
                                        rightIcon={<ChevronRight className="w-4 h-4" />}>
                                        Next
                                    </Button>
                                ) : (
                                    <Button variant="neon-green" size="md" onClick={handleSubmit}>
                                        Submit Round
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar navigator */}
                    <div className="glass rounded-2xl border border-white/10 p-4 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Navigator</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 mb-4">
                            {questions.map((_, i) => (
                                <button key={i} onClick={() => setCurrentQ(i)}
                                    className={`w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${i === currentQ ? "bg-neon-cyan text-background font-bold" :
                                        flagged[i] ? "bg-orange-400/20 border border-orange-400/40 text-orange-400" :
                                            selected[i] !== null ? "bg-neon-green/20 border border-neon-green/30 text-neon-green" :
                                                "bg-white/5 border border-white/10 text-text-muted hover:bg-white/10"
                                        }`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-1.5 text-xs text-text-muted">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-neon-green/20 border border-neon-green/30" />Answered ({answeredCount})</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-400/20 border border-orange-400/40" />Flagged ({flaggedCount})</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white/5 border border-white/10" />Unanswered ({questions.length - answeredCount})</div>
                        </div>
                        <Button variant="danger" size="sm" className="w-full mt-4" onClick={handleSubmit}>
                            Submit Round
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
