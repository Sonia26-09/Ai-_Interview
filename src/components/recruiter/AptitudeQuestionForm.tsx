"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { Difficulty } from "@/lib/types";

export interface AptitudeQ {
    id: string;
    description: string;
    options: string[];
    correctOption: number;
    points: number;
    difficulty: Difficulty;
}

interface Props {
    questions: AptitudeQ[];
    onChange: (questions: AptitudeQ[]) => void;
}

export default function AptitudeQuestionForm({ questions, onChange }: Props) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(questions.length > 0 ? 0 : null);

    const addQuestion = () => {
        const newQ: AptitudeQ = {
            id: `apt-${Date.now()}`,
            description: "",
            options: ["", "", "", ""],
            correctOption: 0,
            points: 10,
            difficulty: "Medium",
        };
        onChange([...questions, newQ]);
        setExpandedIdx(questions.length);
    };

    const removeQuestion = (idx: number) => {
        const updated = questions.filter((_, i) => i !== idx);
        onChange(updated);
        if (expandedIdx === idx) setExpandedIdx(null);
        else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
    };

    const updateQuestion = (idx: number, updates: Partial<AptitudeQ>) => {
        const updated = questions.map((q, i) => (i === idx ? { ...q, ...updates } : q));
        onChange(updated);
    };

    const updateOption = (qIdx: number, optIdx: number, value: string) => {
        const q = questions[qIdx];
        const newOpts = [...q.options];
        newOpts[optIdx] = value;
        updateQuestion(qIdx, { options: newOpts });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-semibold text-text-primary text-sm">Aptitude Questions</h3>
                    <p className="text-xs text-text-muted">{questions.length} question(s) added</p>
                </div>
                <Button variant="primary" size="sm" onClick={addQuestion} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Question
                </Button>
            </div>

            {questions.length === 0 && (
                <div className="text-center py-8 text-text-muted border border-dashed border-white/10 rounded-xl">
                    <p className="text-sm">No questions yet. Click "Add Question" to start.</p>
                </div>
            )}

            {questions.map((q, idx) => {
                const isExpanded = expandedIdx === idx;
                return (
                    <div key={q.id} className="glass rounded-xl border border-white/10 overflow-hidden">
                        <button
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/3 transition-colors"
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        >
                            <div className="w-7 h-7 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-xs font-bold text-neon-blue flex-shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">
                                    {q.description || "Untitled Question"}
                                </p>
                                <p className="text-xs text-text-muted">{q.difficulty} · {q.points} pts · {q.options.filter(o => o).length}/4 options</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                                className="text-text-muted hover:text-red-400 transition-colors p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-white/8 space-y-4">
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Question Text</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Enter your question..."
                                        value={q.description}
                                        onChange={(e) => updateQuestion(idx, { description: e.target.value })}
                                        className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-text-muted block">Options (click radio to set correct answer)</label>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuestion(idx, { correctOption: oi })}
                                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${q.correctOption === oi
                                                    ? "bg-neon-green border-neon-green text-background"
                                                    : "border-white/20 text-text-muted hover:border-white/40"
                                                    }`}
                                            >
                                                {q.correctOption === oi ? <CheckCircle2 className="w-3.5 h-3.5" /> : String.fromCharCode(65 + oi)}
                                            </button>
                                            <input
                                                type="text"
                                                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                                value={opt}
                                                onChange={(e) => updateOption(idx, oi, e.target.value)}
                                                className="flex-1 bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Points</label>
                                        <input type="number" value={q.points} min={1}
                                            onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) || 10 })}
                                            className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Difficulty</label>
                                        <select value={q.difficulty}
                                            onChange={(e) => updateQuestion(idx, { difficulty: e.target.value as Difficulty })}
                                            className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50">
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {questions.length > 0 && (
                <button onClick={addQuestion}
                    className="w-full py-3 border border-dashed border-white/15 rounded-xl text-sm text-text-muted hover:text-neon-cyan hover:border-neon-cyan/30 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Another Question
                </button>
            )}
        </div>
    );
}
