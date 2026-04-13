"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    Trophy, CheckCircle2, XCircle, Brain, TrendingUp, BarChart3,
    RotateCcw, Home, Sparkles, Target, ChevronDown, ChevronUp,
    BookOpen, Lightbulb, Code2, Mic, ClipboardList
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Navbar from "@/components/layout/Navbar";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from "recharts";
import {
    loadFromStorage,
    STORAGE_KEYS,
    generateFullReport,
} from "@/lib/ai-feedback";
import type { AptitudeResult, CodingResult, HRResult, AIFeedback } from "@/lib/types";

// fallback static if no localStorage data
const FALLBACK: AIFeedback = {
    overallScore: 78,
    strengths: [
        "Strong logical reasoning and problem-solving approach",
        "Clean, readable code with good variable naming",
        "Effective communication — structured and empathetic HR answers",
    ],
    improvements: [
        "Dynamic programming patterns need more practice",
        "HR answers can include more measurable outcomes",
        "Review probability concepts for aptitude",
    ],
    recommendation: "Recommend",
    detailedReport:
        "You demonstrated solid performance across all three rounds. Your coding skills stood out, with well-structured solutions. Focused practice on dynamic programming and quantitative aptitude will help push your score into the 'Strongly Recommend' tier.",
    studyPlan: [
        "Practice 10 aptitude questions daily (series, probability, time & work)",
        "Complete Neetcode 150 — focus on Arrays, HashMaps, and DP this week",
        "Write 3 STAR stories from your experience and time yourself answering them",
        "Do one full mock interview per week to practise time management",
    ],
    topicBreakdown: [
        { topic: "Aptitude", score: 78, trend: "up" },
        { topic: "Coding", score: 85, trend: "up" },
        { topic: "HR / Comms", score: 72, trend: "stable" },
        { topic: "Problem Solving", score: 82, trend: "up" },
        { topic: "Speed & Accuracy", score: 80, trend: "stable" },
    ],
};

type ReviewTab = "aptitude" | "coding" | "hr";

export default function InterviewResultsPage() {
    const params = useParams();
    const [report, setReport] = useState<AIFeedback>(FALLBACK);
    const [aptitude, setAptitude] = useState<AptitudeResult | null>(null);
    const [coding, setCoding] = useState<CodingResult | null>(null);
    const [hr, setHr] = useState<HRResult | null>(null);
    const [reviewTab, setReviewTab] = useState<ReviewTab>("aptitude");
    const [showReview, setShowReview] = useState(false);
    const [expandedQ, setExpandedQ] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const apt = loadFromStorage<AptitudeResult>(STORAGE_KEYS.aptitude);
        const cod = loadFromStorage<CodingResult>(STORAGE_KEYS.coding);
        const hrRes = loadFromStorage<HRResult>(STORAGE_KEYS.hr);
        setAptitude(apt);
        setCoding(cod);
        setHr(hrRes);
        if (apt || cod || hrRes) {
            setReport(generateFullReport(apt, cod, hrRes));
        }
    }, []);

    const isPassed = report.overallScore >= 70;

    const radarData = report.topicBreakdown.map(t => ({
        subject: t.topic,
        score: t.score,
    }));

    const barData = [
        { name: "Aptitude", score: aptitude ? Math.round((aptitude.score / aptitude.totalPoints) * 100) : report.topicBreakdown[0]?.score ?? 0, color: "#3b82f6" },
        { name: "Coding", score: coding?.overallScore ?? report.topicBreakdown[1]?.score ?? 0, color: "#00f5ff" },
        { name: "HR", score: hr?.overallScore ?? report.topicBreakdown[2]?.score ?? 0, color: "#a855f7" },
    ];

    const handleCopyReport = () => {
        const text = [
            `AI MOCK INTERVIEW REPORT`,
            `Overall Score: ${report.overallScore}%`,
            `Recommendation: ${report.recommendation}`,
            ``,
            `STRENGTHS:`,
            ...report.strengths.map(s => `• ${s}`),
            ``,
            `AREAS TO IMPROVE:`,
            ...report.improvements.map(s => `• ${s}`),
            ``,
            `PERSONALISED STUDY PLAN:`,
            ...report.studyPlan.map((s, i) => `${i + 1}. ${s}`),
            ``,
            `DETAILED REPORT:`,
            report.detailedReport,
        ].join("\n");
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="Arjun Mehta" />
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* ── Hero ── */}
                <div className={`glass rounded-3xl border p-8 mb-6 text-center relative overflow-hidden ${isPassed ? "border-neon-green/30 bg-neon-green/5" : "border-red-500/30 bg-red-500/5"}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5" />
                    <div className="relative">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isPassed ? "bg-neon-green/20 border-2 border-neon-green/40" : "bg-red-500/20 border-2 border-red-500/40"}`}>
                            {isPassed ? <Trophy className="w-10 h-10 text-neon-green" /> : <XCircle className="w-10 h-10 text-red-400" />}
                        </div>
                        <h1 className="text-4xl font-bold font-display mb-1">
                            {isPassed ? "Congratulations! 🎉" : "Keep Practising!"}
                        </h1>
                        <p className="text-text-secondary mb-6">Interview Complete — AI Report Generated</p>

                        <div className="flex flex-wrap justify-center gap-6">
                            <div>
                                <div className={`text-5xl font-bold font-display mb-1 ${isPassed ? "text-neon-green" : "text-red-400"}`}>{report.overallScore}%</div>
                                <div className="text-xs text-text-muted">Overall Score</div>
                            </div>
                            <div>
                                <div className="text-5xl font-bold font-display mb-1 text-neon-cyan">{report.technicalScore ?? "—"}%</div>
                                <div className="text-xs text-text-muted">Technical Score</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold font-display mb-1 text-neon-purple">+{Math.round(report.overallScore * 4)} XP</div>
                                <div className="text-xs text-text-muted">Earned</div>
                            </div>
                        </div>

                        <Badge variant={isPassed ? "green" : "red"} className="mt-4 mx-auto text-sm px-4 py-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {report.recommendation}
                        </Badge>
                    </div>
                </div>

                {/* ── Charts Row ── */}
                <div className="grid md:grid-cols-2 gap-5 mb-5">
                    {/* Bar chart */}
                    <div className="glass rounded-2xl border border-white/8 p-5">
                        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-neon-cyan" />Round Breakdown
                        </h2>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={barData} barSize={32}>
                                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                    labelStyle={{ color: "#e2e8f0" }}
                                    itemStyle={{ color: "#94a3b8" }}
                                />
                                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                    {barData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Radar chart */}
                    <div className="glass rounded-2xl border border-white/8 p-5">
                        <h2 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-neon-purple" />Skill Radar
                        </h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 10 }} />
                                <Radar name="Score" dataKey="score" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.15} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── AI Performance Report ── */}
                <div className="glass rounded-2xl border border-neon-purple/20 p-6 mb-5 bg-neon-purple/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                            <Brain className="w-4 h-4 text-background" />
                        </div>
                        <h2 className="font-semibold text-text-primary">AI Performance Report</h2>
                        <Badge variant="purple" size="sm">Generated by AI</Badge>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-5">{report.detailedReport}</p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-2">💪 Strengths</h3>
                            <ul className="space-y-1.5">
                                {report.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />{s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">⚡ Improve</h3>
                            <ul className="space-y-1.5">
                                {report.improvements.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                        <TrendingUp className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />{s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── Personalised Study Plan ── */}
                <div className="glass rounded-2xl border border-neon-cyan/20 p-6 mb-5 bg-neon-cyan/3">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-background" />
                        </div>
                        <h2 className="font-semibold text-text-primary">📚 Personalised Study Plan</h2>
                        <Badge variant="cyan" size="sm">AI Tailored</Badge>
                    </div>
                    <p className="text-xs text-text-muted mb-4">Based on your performance, here's your custom action plan to improve before your next interview:</p>
                    <div className="space-y-3">
                        {report.studyPlan.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 glass rounded-xl border border-white/8">
                                <div className="w-6 h-6 rounded-full bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-neon-cyan">{i + 1}</span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Question-by-Question Review ── */}
                {(aptitude || coding || hr) && (
                    <div className="glass rounded-2xl border border-white/10 mb-5 overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
                            onClick={() => setShowReview(v => !v)}>
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-neon-cyan" />
                                <h2 className="font-semibold text-text-primary">🔍 Question-by-Question Review</h2>
                                <Badge variant="default" size="sm">Detailed</Badge>
                            </div>
                            {showReview ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </button>

                        {showReview && (
                            <div className="border-t border-white/8">
                                {/* Tabs */}
                                <div className="flex border-b border-white/8">
                                    {(["aptitude", "coding", "hr"] as ReviewTab[]).map(tab => {
                                        const icons = { aptitude: Target, coding: Code2, hr: Mic };
                                        const Icon = icons[tab];
                                        const hasData = tab === "aptitude" ? !!aptitude : tab === "coding" ? !!coding : !!hr;
                                        return (
                                            <button key={tab} onClick={() => setReviewTab(tab)} disabled={!hasData}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold capitalize transition-all relative ${tab === reviewTab ? "text-neon-cyan tab-active" : hasData ? "text-text-muted hover:text-text-secondary" : "text-white/20 cursor-not-allowed"}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {tab}
                                                {!hasData && <span className="opacity-50 text-[9px]">(no data)</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-5 space-y-3">
                                    {/* Aptitude tab */}
                                    {reviewTab === "aptitude" && aptitude && aptitude.feedbacks.map((fb, i) => {
                                        const q = aptitude.questions[i];
                                        const isExpanded = expandedQ === fb.questionId;
                                        return (
                                            <div key={fb.questionId}
                                                className={`rounded-xl border overflow-hidden transition-all ${fb.isCorrect ? "border-neon-green/20 bg-neon-green/3" : "border-red-500/20 bg-red-500/3"}`}>
                                                <button className="w-full flex items-center gap-3 p-3.5 text-left"
                                                    onClick={() => setExpandedQ(isExpanded ? null : fb.questionId)}>
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${fb.isCorrect ? "bg-neon-green/15 border border-neon-green/30" : "bg-red-500/15 border border-red-500/30"}`}>
                                                        {fb.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span className="text-xs text-text-muted">Q{i + 1}</span>
                                                            <Badge variant={q.difficulty === "Easy" ? "green" : q.difficulty === "Medium" ? "yellow" : "red"} size="sm">{q.difficulty}</Badge>
                                                        </div>
                                                        <p className="text-sm text-text-primary truncate">{q.description}</p>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-2.5 rounded-lg bg-red-500/8 border border-red-500/20 text-xs">
                                                                <div className="text-red-400 font-semibold mb-1">Your Answer</div>
                                                                <div className="text-text-secondary">{fb.selectedOption !== null ? q.options?.[fb.selectedOption] ?? "—" : "Not answered"}</div>
                                                            </div>
                                                            <div className="p-2.5 rounded-lg bg-neon-green/8 border border-neon-green/20 text-xs">
                                                                <div className="text-neon-green font-semibold mb-1">Correct Answer</div>
                                                                <div className="text-text-secondary">{q.options?.[fb.correctOption] ?? "—"}</div>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 rounded-lg bg-neon-purple/5 border border-neon-purple/20">
                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                <Brain className="w-3 h-3 text-neon-purple" />
                                                                <span className="text-xs font-semibold text-neon-purple">AI Explanation</span>
                                                            </div>
                                                            <p className="text-xs text-text-secondary leading-relaxed">{fb.explanation}</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg bg-yellow-400/5 border border-yellow-400/20 flex gap-2">
                                                            <Lightbulb className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <p className="text-xs text-text-secondary">{fb.tip}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Coding tab */}
                                    {reviewTab === "coding" && coding && coding.feedbacks.map((fb, i) => {
                                        const isExpanded = expandedQ === `coding-${fb.questionId}`;
                                        return (
                                            <div key={fb.questionId} className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/3 overflow-hidden">
                                                <button className="w-full flex items-center gap-3 p-3.5 text-left"
                                                    onClick={() => setExpandedQ(isExpanded ? null : `coding-${fb.questionId}`)}>
                                                    <div className="w-7 h-7 rounded-lg bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center">
                                                        <Code2 className="w-3.5 h-3.5 text-neon-cyan" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-text-muted mb-0.5">Problem {i + 1}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-text-primary">AI Score: </span>
                                                            <span className={`text-sm font-bold ${fb.score >= 80 ? "text-neon-green" : fb.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{fb.score}/100</span>
                                                            <span className="text-xs text-text-muted">{fb.timeComplexity} / {fb.spaceComplexity}</span>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <div className="text-xs font-semibold text-neon-green mb-1.5">✓ Did Well</div>
                                                                {fb.didWell.map((s, j) => <div key={j} className="text-xs text-text-secondary flex gap-1.5 mb-1"><span className="text-neon-green">•</span>{s}</div>)}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-semibold text-yellow-400 mb-1.5">⚡ Improve</div>
                                                                {fb.improve.map((s, j) => <div key={j} className="text-xs text-text-secondary flex gap-1.5 mb-1"><span className="text-yellow-400">•</span>{s}</div>)}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 rounded-lg bg-neon-purple/5 border border-neon-purple/20">
                                                            <div className="text-xs font-semibold text-neon-purple mb-1">Model Approach</div>
                                                            <p className="text-xs text-text-secondary leading-relaxed">{fb.modelApproach}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* HR tab */}
                                    {reviewTab === "hr" && hr && hr.feedbacks.map((fb, i) => {
                                        const isExpanded = expandedQ === `hr-${fb.questionId}`;
                                        const dims = [
                                            { label: "Clarity", value: fb.clarity },
                                            { label: "STAR", value: fb.starStructure },
                                            { label: "Specificity", value: fb.specificity },
                                            { label: "Empathy", value: fb.empathy },
                                        ];
                                        return (
                                            <div key={fb.questionId} className="rounded-xl border border-neon-purple/20 bg-neon-purple/3 overflow-hidden">
                                                <button className="w-full flex items-center gap-3 p-3.5 text-left"
                                                    onClick={() => setExpandedQ(isExpanded ? null : `hr-${fb.questionId}`)}>
                                                    <div className="w-7 h-7 rounded-lg bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center">
                                                        <Mic className="w-3.5 h-3.5 text-neon-purple" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-text-muted mb-0.5">Q{i + 1}</div>
                                                        <p className="text-sm text-text-primary truncate">{fb.question.slice(0, 80)}…</p>
                                                    </div>
                                                    <span className={`text-sm font-bold flex-shrink-0 ${fb.overall >= 80 ? "text-neon-green" : fb.overall >= 60 ? "text-yellow-400" : "text-red-400"}`}>{fb.overall}/100</span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted ml-1" /> : <ChevronDown className="w-4 h-4 text-text-muted ml-1" />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                                            {dims.map(d => (
                                                                <div key={d.label}>
                                                                    <div className="flex justify-between text-xs mb-0.5">
                                                                        <span className="text-text-muted">{d.label}</span>
                                                                        <span className={`font-semibold ${d.value >= 80 ? "text-neon-green" : d.value >= 60 ? "text-yellow-400" : "text-red-400"}`}>{d.value}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full ${d.value >= 80 ? "bg-neon-green" : d.value >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                                                                            style={{ width: `${d.value}%` }} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="p-3 rounded-lg bg-neon-purple/5 border border-neon-purple/20 text-xs text-text-secondary italic">
                                                            <CheckCircle2 className="w-3 h-3 text-neon-green inline mr-1.5 mb-0.5" />
                                                            {fb.comment}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-text-muted mb-1">Your Answer</div>
                                                            <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">{fb.answer}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex flex-wrap gap-3 justify-center mt-6">
                    <Link href="/student/practice">
                        <Button variant="primary" leftIcon={<RotateCcw className="w-4 h-4" />}>Practice Again</Button>
                    </Link>
                    <Link href="/student/dashboard">
                        <Button variant="secondary" leftIcon={<Home className="w-4 h-4" />}>Dashboard</Button>
                    </Link>
                    <Button variant="outline" leftIcon={<ClipboardList className="w-4 h-4" />} onClick={handleCopyReport}>
                        {copied ? "✓ Copied!" : "Copy Report"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
