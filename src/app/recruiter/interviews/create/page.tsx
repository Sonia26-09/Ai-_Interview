"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, ArrowRight, Plus, Trash2, GripVertical,
    Clock, Brain, Code2, Mic, Settings, ChevronDown, Check, Sparkles
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Round, RoundType, Difficulty, TechStack } from "@/lib/types";
import { generateId, getRoundTypeColor } from "@/lib/utils";

const TECH_STACKS: TechStack[] = [
    "JavaScript", "TypeScript", "Python", "Java", "C++",
    "React", "Node.js", "Next.js", "Django", "Spring Boot",
    "MongoDB", "PostgreSQL", "DSA", "System Design", "AI/ML", "DevOps"
];

const ROUND_TEMPLATES: { type: RoundType; icon: any; title: string; desc: string; color: string }[] = [
    { type: "aptitude", icon: Brain, title: "Aptitude Round", desc: "MCQ-based reasoning, logic & aptitude", color: "blue" },
    { type: "coding", icon: Code2, title: "Coding Round", desc: "DSA + tech stack coding challenges", color: "cyan" },
    { type: "hr", icon: Mic, title: "HR Round", desc: "Behavioural & situational AI interview", color: "purple" },
];

const steps = ["Basic Info", "Build Rounds", "Settings", "Review"];

export default function CreateInterviewPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        title: "", role: "", description: "", deadline: "",
        difficulty: "Medium" as Difficulty, passingScore: 70,
        antiCheat: true, techStack: [] as TechStack[]
    });

    const addRound = (type: RoundType) => {
        const template = ROUND_TEMPLATES.find(t => t.type === type)!;
        const newRound: Round = {
            id: generateId(),
            type,
            title: template.title,
            duration: type === "coding" ? 60 : 30,
            difficulty: "Medium",
            questionCount: type === "aptitude" ? 25 : type === "coding" ? 3 : 6,
            isRequired: true,
            order: rounds.length + 1,
        };
        setRounds([...rounds, newRound]);
    };

    const removeRound = (id: string) => setRounds(rounds.filter(r => r.id !== id));

    const updateRound = (id: string, updates: Partial<Round>) => {
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

    const handleSubmit = async () => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1800));
        window.location.href = "/recruiter/interviews";
    };

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName="Sarah Chen" />

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
                <p className="text-text-secondary text-sm mb-8">Build a custom multi-round interview powered by AI</p>

                {/* Stepper */}
                <div className="flex items-center gap-0 mb-10">
                    {steps.map((s, i) => (
                        <div key={s} className="flex items-center flex-1">
                            <button
                                onClick={() => i <= currentStep && setCurrentStep(i)}
                                className={`flex items-center gap-2 group transition-all ${i <= currentStep ? "cursor-pointer" : "cursor-default"}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${i < currentStep ? "bg-neon-cyan text-background" :
                                        i === currentStep ? "bg-gradient-to-br from-neon-cyan to-neon-purple text-background shadow-neon-cyan" :
                                            "bg-surface-2 border border-border text-text-muted"
                                    }`}>
                                    {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={`hidden sm:block text-sm font-medium transition-colors ${i === currentStep ? "text-text-primary" : "text-text-muted"
                                    }`}>{s}</span>
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
                                <textarea
                                    rows={3}
                                    placeholder="Describe what candidates should expect..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 resize-none"
                                />
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
                                                    : "glass border-white/10 text-text-muted hover:border-white/20"
                                                }`}>{d}</button>
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

                            {/* Round Templates */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
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

                            {/* Added Rounds */}
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
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-xs text-text-muted mb-1 block">Duration (min)</label>
                                                            <input type="number" value={round.duration}
                                                                onChange={e => updateRound(round.id, { duration: parseInt(e.target.value) })}
                                                                className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-text-muted mb-1 block">Questions</label>
                                                            <input type="number" value={round.questionCount}
                                                                onChange={e => updateRound(round.id, { questionCount: parseInt(e.target.value) })}
                                                                className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-text-muted mb-1 block">Difficulty</label>
                                                            <select value={round.difficulty}
                                                                onChange={e => updateRound(round.id, { difficulty: e.target.value as Difficulty })}
                                                                className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50">
                                                                <option>Easy</option>
                                                                <option>Medium</option>
                                                                <option>Hard</option>
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

                    {/* Step 3: Settings */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <h2 className="font-semibold text-lg mb-1">Interview Settings</h2>

                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-2 block">Required Tech Stack</label>
                                <div className="flex flex-wrap gap-2">
                                    {TECH_STACKS.map(stack => {
                                        const selected = form.techStack.includes(stack);
                                        return (
                                            <button key={stack} onClick={() => toggleStack(stack)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan" : "glass border-white/10 text-text-muted hover:border-white/20"
                                                    }`}>
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
                                <button
                                    onClick={() => setForm({ ...form, antiCheat: !form.antiCheat })}
                                    className={`w-11 h-6 rounded-full transition-all relative ${form.antiCheat ? "bg-neon-cyan" : "bg-white/10"}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.antiCheat ? "left-6" : "left-1"}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 3 && (
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
                                            {rounds.map((r, i) => (
                                                <div key={r.id} className="flex items-center gap-2 text-sm">
                                                    <span className="text-text-muted">{i + 1}.</span>
                                                    <span>{r.title}</span>
                                                    <Badge variant={r.type === "aptitude" ? "blue" : r.type === "coding" ? "cyan" : "purple"} size="sm">
                                                        {r.type}
                                                    </Badge>
                                                    <span className="text-text-muted ml-auto">{r.duration}min</span>
                                                </div>
                                            ))}
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
                                <div className="flex items-center gap-2 px-4 py-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl">
                                    <Sparkles className="w-4 h-4 text-neon-cyan" />
                                    <p className="text-xs text-neon-cyan">AI will auto-generate all questions after publishing.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
