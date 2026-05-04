"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, ArrowRight, Plus, Trash2, GripVertical,
    Clock, Brain, Code2, Settings, Check, Sparkles, CheckCircle
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import AptitudeQuestionForm, { type AptitudeQ } from "@/components/recruiter/AptitudeQuestionForm";
import CodingQuestionForm, { type CodingQ } from "@/components/recruiter/CodingQuestionForm";
import { Difficulty, TechStack } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface RoundLocal {
    id: string;
    type: "aptitude" | "coding";
    title: string;
    duration: number;
    difficulty: Difficulty;
    isRequired: boolean;
    order: number;
}

const TECH_STACKS: TechStack[] = [
    "JavaScript", "TypeScript", "Python", "Java", "C++",
    "React", "Node.js", "Next.js", "Django", "Spring Boot",
    "MongoDB", "PostgreSQL", "DSA", "System Design", "AI/ML", "DevOps"
];

const ROUND_TEMPLATES: { type: "aptitude" | "coding"; icon: any; title: string; desc: string; color: string }[] = [
    { type: "aptitude", icon: Brain, title: "Aptitude Round", desc: "MCQ-based reasoning, logic & aptitude", color: "blue" },
    { type: "coding", icon: Code2, title: "Coding Round", desc: "DSA + tech stack coding challenges", color: "cyan" },
];

const steps = ["Basic Info", "Build Rounds", "Add Questions", "Settings", "Review"];

export default function CreateInterviewPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [rounds, setRounds] = useState<RoundLocal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "", role: "", description: "", deadline: "",
        difficulty: "Medium" as Difficulty, passingScore: 70,
        antiCheat: true, techStack: [] as TechStack[]
    });

    // Questions keyed by round.id
    const [aptitudeQuestions, setAptitudeQuestions] = useState<Record<string, AptitudeQ[]>>({});
    const [codingQuestions, setCodingQuestions] = useState<Record<string, CodingQ[]>>({});

    const addRound = (type: "aptitude" | "coding") => {
        const template = ROUND_TEMPLATES.find(t => t.type === type)!;
        const newRound: RoundLocal = {
            id: generateId(),
            type,
            title: template.title,
            duration: type === "coding" ? 60 : 30,
            difficulty: "Medium",
            isRequired: true,
            order: rounds.length + 1,
        };
        setRounds([...rounds, newRound]);
    };

    const removeRound = (id: string) => {
        setRounds(rounds.filter(r => r.id !== id));
        const newApt = { ...aptitudeQuestions }; delete newApt[id]; setAptitudeQuestions(newApt);
        const newCod = { ...codingQuestions }; delete newCod[id]; setCodingQuestions(newCod);
    };

    const updateRound = (id: string, updates: Partial<RoundLocal>) => {
        setRounds(rounds.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const toggleStack = (stack: TechStack) => {
        setForm(prev => ({
            ...prev,
            techStack: prev.techStack.includes(stack)
                ? prev.techStack.filter(s => s !== stack)
                : [...prev.techStack, stack]
        }));
    };

    const getTotalQuestions = () => {
        let total = 0;
        rounds.forEach(r => {
            if (r.type === "aptitude") total += (aptitudeQuestions[r.id] || []).length;
            if (r.type === "coding") total += (codingQuestions[r.id] || []).length;
        });
        return total;
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError("Interview title is required."); return; }
        if (rounds.length === 0) { setError("Add at least one round."); return; }
        if (getTotalQuestions() === 0) { setError("Add at least one question."); return; }

        setIsLoading(true);
        setError(null);

        try {
            // Flatten all questions with roundId
            const allQuestions: any[] = [];
            rounds.forEach(r => {
                if (r.type === "aptitude") {
                    (aptitudeQuestions[r.id] || []).forEach((q, i) => {
                        allQuestions.push({
                            roundId: r.id, type: "aptitude", title: `Q${i + 1}`,
                            description: q.description, options: q.options,
                            correctOption: q.correctOption, points: q.points,
                            difficulty: q.difficulty, order: i, tags: [],
                        });
                    });
                }
                if (r.type === "coding") {
                    (codingQuestions[r.id] || []).forEach((q, i) => {
                        allQuestions.push({
                            roundId: r.id, type: "coding", title: q.title,
                            description: q.description, functionName: q.functionName,
                            starterCode: q.starterCode, testCases: q.testCases,
                            points: q.points, difficulty: q.difficulty,
                            order: i, tags: q.tags,
                        });
                    });
                }
            });

            const res = await fetch("/api/interviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title.trim(),
                    role: form.role.trim(),
                    description: form.description,
                    rounds: rounds.map(r => ({
                        type: r.type, title: r.title, duration: r.duration,
                        difficulty: r.difficulty,
                        questionCount: r.type === "aptitude"
                            ? (aptitudeQuestions[r.id] || []).length
                            : (codingQuestions[r.id] || []).length,
                        techStack: [], isRequired: r.isRequired, order: r.order,
                        frontendId: r.id,
                    })),
                    questions: allQuestions,
                    difficulty: form.difficulty,
                    deadline: form.deadline || null,
                    passingScore: form.passingScore,
                    techStack: form.techStack,
                    antiCheat: form.antiCheat,
                }),
            });

            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to create interview."); setIsLoading(false); return; }
            window.location.href = "/recruiter/interviews";
        } catch (err) {
            console.error("Create interview error:", err);
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName="Recruiter" />

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Link href="/recruiter/interviews" className="hover:text-text-secondary flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />Interviews
                    </Link>
                    <span>/</span>
                    <span className="text-text-primary">Create New</span>
                </div>

                <h1 className="text-2xl font-bold font-display mb-2">Create Interview</h1>
                <p className="text-text-secondary text-sm mb-8">Build a custom multi-round interview with your own questions</p>

                {/* Stepper */}
                <div className="flex items-center gap-0 mb-10">
                    {steps.map((s, i) => (
                        <div key={s} className="flex items-center flex-1">
                            <button onClick={() => i <= currentStep && setCurrentStep(i)}
                                className={`flex items-center gap-2 group transition-all ${i <= currentStep ? "cursor-pointer" : "cursor-default"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${i < currentStep ? "bg-neon-cyan text-background" :
                                    i === currentStep ? "bg-gradient-to-br from-neon-cyan to-neon-purple text-background shadow-neon-cyan" :
                                        "bg-surface-2 border border-border text-text-muted"}`}>
                                    {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={`hidden sm:block text-sm font-medium transition-colors ${i === currentStep ? "text-text-primary" : "text-text-muted"}`}>{s}</span>
                            </button>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-px mx-3 transition-all ${i < currentStep ? "bg-neon-cyan/50" : "bg-border"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="glass rounded-2xl border border-white/10 p-6 mb-6">

                    {/* Step 1: Basic Info */}
                    {currentStep === 0 && (
                        <div className="space-y-5">
                            <h2 className="font-semibold text-lg mb-1">Interview Details</h2>
                            <Input label="Interview Title" placeholder="e.g., Senior Frontend Engineer — Google"
                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            <Input label="Role / Position" placeholder="e.g., Software Engineer L5"
                                value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                                <textarea rows={3} placeholder="Describe what candidates should expect..."
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Overall Difficulty</label>
                                <div className="flex gap-2">
                                    {(["Easy", "Medium", "Hard"] as Difficulty[]).map(d => (
                                        <button key={d} onClick={() => setForm({ ...form, difficulty: d })}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.difficulty === d
                                                ? d === "Easy" ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                                                    : d === "Medium" ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-300"
                                                        : "bg-red-400/10 border-red-400/40 text-red-400"
                                                : "glass border-white/10 text-text-muted hover:border-white/20"}`}>{d}</button>
                                    ))}
                                </div>
                            </div>
                            <Input label="Application Deadline (optional)" type="date"
                                value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                        </div>
                    )}

                    {/* Step 2: Build Rounds */}
                    {currentStep === 1 && (
                        <div>
                            <h2 className="font-semibold text-lg mb-1">Build Your Rounds</h2>
                            <p className="text-text-muted text-sm mb-5">Add rounds in the order candidates will take them</p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {ROUND_TEMPLATES.map((t) => {
                                    const Icon = t.icon;
                                    return (
                                        <button key={t.type} onClick={() => addRound(t.type)}
                                            className={`p-4 rounded-xl border bg-neon-${t.color}/5 border-neon-${t.color}/20 text-left hover:bg-neon-${t.color}/10 hover:border-neon-${t.color}/40 transition-all group`}>
                                            <Icon className={`w-5 h-5 text-neon-${t.color} mb-2 group-hover:scale-110 transition-transform`} />
                                            <div className="text-sm font-medium text-text-primary">{t.title}</div>
                                            <div className="text-xs text-text-muted mt-0.5">{t.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            {rounds.length === 0 ? (
                                <div className="text-center py-8 text-text-muted border border-dashed border-white/10 rounded-xl">
                                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-25" />
                                    <p className="text-sm">No rounds added yet. Click above to add rounds.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {rounds.map((round, i) => (
                                        <div key={round.id} className="glass rounded-xl border border-white/10 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-text-muted mt-1"><GripVertical className="w-4 h-4" /></div>
                                                <div className="w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-xs font-bold text-text-primary flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <Input placeholder="Round title" value={round.title}
                                                        onChange={e => updateRound(round.id, { title: e.target.value })} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs text-text-muted mb-1 block">Duration (min)</label>
                                                            <input type="number" value={round.duration}
                                                                onChange={e => updateRound(round.id, { duration: parseInt(e.target.value) })}
                                                                className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-text-muted mb-1 block">Difficulty</label>
                                                            <select value={round.difficulty}
                                                                onChange={e => updateRound(round.id, { difficulty: e.target.value as Difficulty })}
                                                                className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50">
                                                                <option>Easy</option><option>Medium</option><option>Hard</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeRound(round.id)}
                                                    className="text-text-muted hover:text-red-400 transition-colors p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Add Questions */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className="font-semibold text-lg mb-1">Add Questions</h2>
                            <p className="text-text-muted text-sm mb-5">Define questions for each round. Students will see exactly what you enter here.</p>

                            {rounds.length === 0 ? (
                                <div className="text-center py-8 text-text-muted">
                                    <p className="text-sm">Go back and add rounds first.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {rounds.map((round, i) => (
                                        <div key={round.id}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant={round.type === "aptitude" ? "blue" : "cyan"} size="sm">
                                                    Round {i + 1}: {round.type}
                                                </Badge>
                                                <span className="text-sm font-medium text-text-primary">{round.title}</span>
                                            </div>

                                            {round.type === "aptitude" && (
                                                <AptitudeQuestionForm
                                                    questions={aptitudeQuestions[round.id] || []}
                                                    onChange={(qs) => setAptitudeQuestions({ ...aptitudeQuestions, [round.id]: qs })}
                                                />
                                            )}

                                            {round.type === "coding" && (
                                                <CodingQuestionForm
                                                    questions={codingQuestions[round.id] || []}
                                                    onChange={(qs) => setCodingQuestions({ ...codingQuestions, [round.id]: qs })}
                                                />
                                            )}

                                            {i < rounds.length - 1 && <hr className="border-white/8 mt-6" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Settings */}
                    {currentStep === 3 && (
                        <div className="space-y-5">
                            <h2 className="font-semibold text-lg mb-1">Interview Settings</h2>
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-2 block">Required Tech Stack</label>
                                <div className="flex flex-wrap gap-2">
                                    {TECH_STACKS.map(stack => {
                                        const selected = form.techStack.includes(stack);
                                        return (
                                            <button key={stack} onClick={() => toggleStack(stack)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan" : "glass border-white/10 text-text-muted hover:border-white/20"}`}>
                                                {selected && <Check className="w-3 h-3" />}{stack}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-2 block">
                                    Passing Score: <span className="text-neon-cyan">{form.passingScore}%</span>
                                </label>
                                <input type="range" min={40} max={90} step={5} value={form.passingScore}
                                    onChange={e => setForm({ ...form, passingScore: parseInt(e.target.value) })}
                                    className="w-full accent-cyan-400" />
                                <div className="flex justify-between text-xs text-text-muted mt-1"><span>40%</span><span>90%</span></div>
                            </div>
                            <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/10">
                                <div>
                                    <div className="text-sm font-medium text-text-primary">Anti-Cheat Monitoring</div>
                                    <div className="text-xs text-text-muted mt-0.5">Tab switch detection, focus monitoring</div>
                                </div>
                                <button onClick={() => setForm({ ...form, antiCheat: !form.antiCheat })}
                                    className={`w-11 h-6 rounded-full transition-all relative ${form.antiCheat ? "bg-neon-cyan" : "bg-white/10"}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.antiCheat ? "left-6" : "left-1"}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 4 && (
                        <div>
                            <h2 className="font-semibold text-lg mb-4">Review & Publish</h2>
                            <div className="space-y-4">
                                <div className="p-4 glass rounded-xl border border-white/10">
                                    <div className="text-xs text-text-muted mb-1">Interview Title</div>
                                    <div className="font-semibold">{form.title || "Untitled Interview"}</div>
                                </div>
                                <div className="p-4 glass rounded-xl border border-white/10">
                                    <div className="text-xs text-text-muted mb-2">Rounds ({rounds.length})</div>
                                    {rounds.length === 0 ? (
                                        <p className="text-sm text-text-muted">No rounds added</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {rounds.map((r, i) => {
                                                const qCount = r.type === "aptitude"
                                                    ? (aptitudeQuestions[r.id] || []).length
                                                    : (codingQuestions[r.id] || []).length;
                                                return (
                                                    <div key={r.id} className="flex items-center gap-2 text-sm">
                                                        <span className="text-text-muted">{i + 1}.</span>
                                                        <span>{r.title}</span>
                                                        <Badge variant={r.type === "aptitude" ? "blue" : "cyan"} size="sm">{r.type}</Badge>
                                                        <span className="text-text-muted ml-auto">{qCount} questions · {r.duration}min</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 glass rounded-xl border border-white/10">
                                        <div className="text-xs text-text-muted mb-1">Difficulty</div>
                                        <div className="font-semibold">{form.difficulty}</div>
                                    </div>
                                    <div className="p-4 glass rounded-xl border border-white/10">
                                        <div className="text-xs text-text-muted mb-1">Passing Score</div>
                                        <div className="font-semibold">{form.passingScore}%</div>
                                    </div>
                                </div>
                                <div className="p-4 glass rounded-xl border border-white/10">
                                    <div className="text-xs text-text-muted mb-1">Total Questions</div>
                                    <div className="font-semibold">{getTotalQuestions()}</div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-3 bg-neon-green/5 border border-neon-green/20 rounded-xl">
                                    <CheckCircle className="w-4 h-4 text-neon-green" />
                                    <p className="text-xs text-neon-green">All questions are recruiter-defined. Score will be calculated based on your answers.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <span>⚠️</span><span>{error}</span>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button variant="secondary" size="lg" disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}
                        leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                    {currentStep < steps.length - 1 ? (
                        <Button variant="primary" size="lg" onClick={() => setCurrentStep(s => s + 1)}
                            rightIcon={<ArrowRight className="w-4 h-4" />}>Continue</Button>
                    ) : (
                        <Button variant="primary" size="lg" isLoading={isLoading} onClick={handleSubmit}
                            leftIcon={!isLoading && <Sparkles className="w-4 h-4" />}>
                            Publish Interview
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
}
