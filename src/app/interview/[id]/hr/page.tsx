"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Brain, Send, ArrowRight, BarChart3,
    ThumbsUp, Clock, Sparkles, CheckCircle2, MessageSquare
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Navbar from "@/components/layout/Navbar";
import { mockHRQuestions } from "@/lib/mock-data";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
    generateHRFeedback,
    buildHRResult,
    saveToStorage,
    STORAGE_KEYS,
} from "@/lib/ai-feedback";
import type { HRAnswerFeedback } from "@/lib/types";

const CONFIDENCE_DATA = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    confidence: 50 + Math.sin(i * 0.5) * 20 + Math.random() * 15,
}));

interface Message {
    role: "ai" | "user";
    content: string;
    score?: number;
    timestamp: Date;
    questionId?: string;
    answerText?: string;
}

const AI_FOLLOWUPS = [
    "That's a great example! Can you elaborate on what specific steps you took to resolve it?",
    "Interesting perspective. How did that experience shape your approach to similar situations?",
    "Thank you for sharing. What would you do differently if you faced the same situation today?",
    "I appreciate your transparency. How did your team respond to your leadership in that moment?",
];

const SCORE_LABELS: Record<string, string> = {
    clarity: "Clarity",
    starStructure: "STAR Structure",
    specificity: "Specificity",
    empathy: "Empathy",
};

const SCORE_COLORS: Record<string, string> = {
    clarity: "cyan",
    starStructure: "purple",
    specificity: "green",
    empathy: "pink",
};

export default function HRRoundPage() {
    const params = useParams();
    const [currentQ, setCurrentQ] = useState(0);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: "Hello, thank you for joining today. I'm your HR interviewer. Let's begin with a brief introduction about yourself.",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [confidenceData, setConfidenceData] = useState(CONFIDENCE_DATA.slice(0, 3));
    const [liveConfidence, setLiveConfidence] = useState(72);
    const [roundComplete, setRoundComplete] = useState(false);
    const [answerFeedbacks, setAnswerFeedbacks] = useState<HRAnswerFeedback[]>([]);
    const [showFeedbackSummary, setShowFeedbackSummary] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveConfidence(c => Math.min(100, Math.max(30, c + (Math.random() - 0.45) * 5)));
            setConfidenceData(prev => {
                const newPoint = { time: prev.length, confidence: liveConfidence + (Math.random() - 0.5) * 10 };
                return [...prev.slice(-15), newPoint];
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [liveConfidence]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            role: "user",
            content: input,
            timestamp: new Date(),
        };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsTyping(true);

        try {
            // Format history for the API
            const history = updatedMessages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch("/api/hr/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ history }),
            });

            if (!response.ok) {
                throw new Error("API response error");
            }

            const data = await response.json();
            
            // Check if the AI ended the interview (heuristic check based on common closing phrases)
            const isClosing = data.text.toLowerCase().includes("do you have any questions for me") || data.text.toLowerCase().includes("that concludes our interview");

            const aiMsg: Message = {
                role: "ai",
                content: data.text,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMsg]);
            setCurrentQ(q => q + 1);

            // Compute background evaluation silently
            const fb = generateHRFeedback(
                `q-${currentQ}`,
                "Contextual HR Question",
                userMsg.content,
                liveConfidence
            );
            setAnswerFeedbacks(prev => [...prev, fb]);

            if (isClosing || currentQ >= 15) { // fallback end condition
                setRoundComplete(true);
                const allFeedbacks = [...answerFeedbacks, fb];
                const hrResult = buildHRResult(allFeedbacks, Math.round(liveConfidence));
                saveToStorage(STORAGE_KEYS.hr, hrResult);
                setShowFeedbackSummary(true);
            }

        } catch (error) {
            console.error("Failed to fetch HR response:", error);
            
            // Graceful fallback to maintain interview continuity
            const fallbackQuestions = [
                "I’m sorry for the brief interruption. Let’s continue with the interview. Could you elaborate more on what you just shared?",
                "My apologies, we had a brief connection drop. What challenges did you face in that situation?",
                "I apologize for the delay. Which part of your work are you most proud of and why?",
                "Let's move forward. How did you ensure quality and performance in your recent project?",
                "Thanks for sharing. Where do you see your career heading in the next few years?"
            ];
            
            // Select a fallback question, ensuring some variety based on the question index
            const fallbackContent = fallbackQuestions[currentQ % fallbackQuestions.length];
            
            setMessages(prev => [...prev, {
                role: "ai",
                content: fallbackContent,
                timestamp: new Date()
            }]);
            setCurrentQ(q => q + 1);
        } finally {
            setIsTyping(false);
        }
    };

    const getScoreColor = (s: number) =>
        s >= 80 ? "text-neon-green" : s >= 60 ? "text-neon-cyan" : s >= 40 ? "text-yellow-400" : "text-red-400";

    const getScoreBarColor = (s: number) =>
        s >= 80 ? "bg-neon-green" : s >= 60 ? "bg-neon-cyan" : s >= 40 ? "bg-yellow-400" : "bg-red-400";

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="Arjun Mehta" />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-5">

                    {/* Chat Panel */}
                    <div className="flex-1 flex flex-col glass rounded-2xl border border-white/10" style={{ height: showFeedbackSummary ? "auto" : "calc(100vh - 140px)" }}>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                                <Brain className="w-5 h-5 text-background" />
                            </div>
                            <div>
                                <div className="font-semibold text-text-primary text-sm">AI Interviewer</div>
                                <div className="text-xs text-neon-green flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                                    Live Session
                                </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <Badge variant="purple" size="sm">HR Round</Badge>
                                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                    <Clock className="w-3.5 h-3.5" />
                                    Exchange {currentQ + 1}
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="h-0.5 bg-white/5">
                            <div className="h-full bg-gradient-to-r from-neon-purple to-neon-pink transition-all duration-500"
                                style={{ width: `${Math.min(100, ((currentQ) / 10) * 100)}%` }} />
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: "450px" }}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === "ai"
                                        ? "bg-gradient-to-br from-neon-purple to-neon-pink"
                                        : "bg-gradient-to-br from-neon-cyan/30 to-neon-blue/30 border border-neon-cyan/20"
                                        }`}>
                                        {msg.role === "ai"
                                            ? <Brain className="w-4 h-4 text-background" />
                                            : <span className="text-xs font-bold text-neon-cyan">A</span>
                                        }
                                    </div>
                                    <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === "ai"
                                            ? "glass border border-white/8 text-text-primary rounded-tl-sm"
                                            : "bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 border border-neon-cyan/20 text-text-primary rounded-tr-sm"
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <div className="text-xs text-text-muted">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-background" />
                                    </div>
                                    <div className="glass border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-neon-purple animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-neon-purple animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-neon-purple animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        {!roundComplete ? (
                            <div className="p-4 border-t border-white/8">
                                <div className="flex gap-2">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                                        rows={2}
                                        className="flex-1 bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted px-4 py-2.5 focus:outline-none focus:border-neon-purple/50 focus:ring-2 focus:ring-neon-purple/10 resize-none"
                                        disabled={isTyping}
                                    />
                                    <Button variant="neon-purple" size="md" onClick={handleSend}
                                        disabled={!input.trim() || isTyping}
                                        leftIcon={<Send className="w-4 h-4" />}>
                                        Send
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border-t border-white/8 flex gap-3">
                                <Button variant="ghost" size="md" className="flex-1"
                                    onClick={() => setShowFeedbackSummary(v => !v)}
                                    leftIcon={<MessageSquare className="w-4 h-4" />}>
                                    {showFeedbackSummary ? "Hide" : "Show"} Answer Feedback
                                </Button>
                                <Link href={`/interview/${params.id}/results`} className="flex-1">
                                    <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                        View Full AI Report
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Per-answer feedback summary (shown after round complete) */}
                        {showFeedbackSummary && answerFeedbacks.length > 0 && (
                            <div className="border-t border-white/8 p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                                        <Brain className="w-3 h-3 text-background" />
                                    </div>
                                    <h3 className="font-semibold text-text-primary text-sm">Per-Answer AI Breakdown</h3>
                                    <Badge variant="purple" size="sm">AI Generated</Badge>
                                </div>

                                {answerFeedbacks.map((fb, idx) => {
                                    const dims = [
                                        { key: "clarity", value: fb.clarity },
                                        { key: "starStructure", value: fb.starStructure },
                                        { key: "specificity", value: fb.specificity },
                                        { key: "empathy", value: fb.empathy },
                                    ];
                                    return (
                                        <div key={fb.questionId} className="glass rounded-xl border border-white/10 p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-xs font-semibold text-text-muted">Q{idx + 1}: {fb.question.slice(0, 60)}…</div>
                                                <div className={`text-lg font-bold font-display ${getScoreColor(fb.overall)}`}>{fb.overall}/100</div>
                                            </div>
                                            {/* 4 dimension bars */}
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
                                                {dims.map(d => (
                                                    <div key={d.key}>
                                                        <div className="flex justify-between text-xs mb-0.5">
                                                            <span className="text-text-muted">{SCORE_LABELS[d.key]}</span>
                                                            <span className={`font-semibold ${getScoreColor(d.value)}`}>{d.value}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-700 ${getScoreBarColor(d.value)}`}
                                                                style={{ width: `${d.value}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* AI Comment */}
                                            <div className="text-xs text-text-secondary italic border-t border-white/8 pt-2 mt-2 flex gap-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-neon-green flex-shrink-0 mt-0.5" />
                                                {fb.comment}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Live Analytics */}
                    <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
                        {/* Live Confidence */}
                        <div className="glass rounded-2xl border border-neon-purple/20 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-neon-purple" />
                                <span className="text-sm font-semibold text-text-primary">Live Confidence</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse ml-auto" />
                            </div>
                            <div className="text-4xl font-bold font-display text-neon-purple mb-3">
                                {liveConfidence.toFixed(0)}%
                            </div>
                            <ResponsiveContainer width="100%" height={80}>
                                <AreaChart data={confidenceData}>
                                    <defs>
                                        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="confidence" stroke="#a855f7" strokeWidth={2} fill="url(#confGrad)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Session Stats */}
                        <div className="glass rounded-2xl border border-white/8 p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-text-primary">Session Stats</h3>
                            {[
                                { label: "Communication", score: 82, color: "cyan" },
                                { label: "Clarity", score: 75, color: "green" },
                                { label: "Structure", score: 68, color: "purple" },
                                { label: "Empathy", score: 90, color: "pink" },
                            ].map(s => (
                                <div key={s.label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-text-muted">{s.label}</span>
                                        <span className={`font-semibold text-neon-${s.color}`}>{s.score}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full bg-neon-${s.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${s.score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tips */}
                        <div className="glass rounded-2xl border border-neon-green/20 p-4 bg-neon-green/5">
                            <div className="flex items-center gap-2 mb-2">
                                <ThumbsUp className="w-4 h-4 text-neon-green" />
                                <span className="text-sm font-semibold text-neon-green">AI Tip</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Use the STAR method (Situation, Task, Action, Result) for structured and compelling answers.
                            </p>
                        </div>

                        {/* Questions progress */}
                        {answerFeedbacks.length > 0 && (
                            <div className="glass rounded-2xl border border-white/8 p-4">
                                <h3 className="text-sm font-semibold text-text-primary mb-3">Answers Scored</h3>
                                <div className="space-y-2">
                                    {answerFeedbacks.map((fb, i) => (
                                        <div key={fb.questionId} className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-neon-green/20 border border-neon-green/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[9px] font-bold text-neon-green">{i + 1}</span>
                                            </div>
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getScoreBarColor(fb.overall)}`}
                                                    style={{ width: `${fb.overall}%` }} />
                                            </div>
                                            <span className={`text-xs font-semibold ${getScoreColor(fb.overall)}`}>{fb.overall}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
