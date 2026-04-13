"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Brain, Clock, Shield, AlertTriangle, CheckCircle, Users,
    BarChart3, Play, ArrowLeft, Code2, Mic, Target
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { mockInterviews, practiceTemplates } from "@/lib/mock-data";
import { formatDuration } from "@/lib/utils";

export default function InterviewStartPage() {
    const params = useParams();
    const id = params.id as string;

    // Try to match a practice template or a real interview
    const template = practiceTemplates.find(t => t.id === id);
    const interview = mockInterviews.find(i => i.id === id);

    const title = template?.title || interview?.title || "Mock Interview";
    const company = template?.company || interview?.company || "Practice Mode";
    const description = template?.description || interview?.description || "Practice interview with AI feedback.";
    const difficulty = template?.difficulty || interview?.difficulty || "Medium";
    const rounds = interview?.rounds || [
        { id: "r1", type: "aptitude" as const, title: "Aptitude Round", duration: 30, difficulty: "Medium" as const, questionCount: 25, isRequired: true, order: 1 },
        { id: "r2", type: "coding" as const, title: "Coding Round", duration: 60, difficulty: "Medium" as const, questionCount: 3, isRequired: true, order: 2 },
        { id: "r3", type: "hr" as const, title: "HR Round", duration: 30, difficulty: "Easy" as const, questionCount: 6, isRequired: false, order: 3 },
    ];
    const totalDuration = rounds.reduce((a, r) => a + r.duration, 0);

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="Arjun Mehta" />
            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Back */}
                <Link href="/student/practice" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-6 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />Back to Practice
                </Link>

                {/* Header */}
                <div className="glass rounded-2xl border border-white/10 p-8 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Badge variant="cyan">{company}</Badge>
                        <Badge variant={difficulty === "Hard" ? "red" : difficulty === "Medium" ? "yellow" : "green"}>{difficulty}</Badge>
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
                        {interview?.antiCheat && (
                            <div className="flex items-center gap-2 text-text-muted">
                                <Shield className="w-4 h-4 text-orange-400" />Anti-cheat enabled
                            </div>
                        )}
                    </div>
                </div>

                {/* Rounds */}
                <div className="glass rounded-2xl border border-white/10 p-6 mb-5">
                    <h2 className="font-semibold text-text-primary mb-4">Interview Rounds</h2>
                    <div className="space-y-3">
                        {rounds.map((round, i) => {
                            const icons = { aptitude: Target, coding: Code2, hr: Mic };
                            const colors = { aptitude: "blue", coding: "cyan", hr: "purple" };
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

                {/* Start */}
                <Link href={`/interview/${id}/aptitude`}>
                    <Button variant="primary" size="xl" className="w-full" leftIcon={<Play className="w-5 h-5" />}>
                        Begin Interview
                    </Button>
                </Link>
                <p className="text-center text-xs text-text-muted mt-3">By starting, you agree to fair assessment practices</p>
            </div>
        </div>
    );
}
