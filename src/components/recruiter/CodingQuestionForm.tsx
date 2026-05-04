"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Code2 } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Difficulty } from "@/lib/types";

export interface CodingTestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    description: string;
}

export interface CodingQ {
    id: string;
    title: string;
    description: string;
    functionName: string;
    difficulty: Difficulty;
    points: number;
    tags: string[];
    starterCode: Record<string, string>;
    testCases: CodingTestCase[];
}

interface Props {
    questions: CodingQ[];
    onChange: (questions: CodingQ[]) => void;
}

const EMPTY_STARTER: Record<string, string> = {
    javascript: "function solve() {\n  // Write your code here\n}",
    python: "def solve():\n    # Write your code here\n    pass",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
};

export default function CodingQuestionForm({ questions, onChange }: Props) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(questions.length > 0 ? 0 : null);
    const [activeCodeLang, setActiveCodeLang] = useState<string>("javascript");

    const addQuestion = () => {
        const newQ: CodingQ = {
            id: `cod-${Date.now()}`,
            title: "",
            description: "",
            functionName: "solve",
            difficulty: "Medium",
            points: 100,
            tags: [],
            starterCode: { ...EMPTY_STARTER },
            testCases: [
                { id: `tc-${Date.now()}-1`, input: "", expectedOutput: "", isHidden: false, description: "Sample test" },
                { id: `tc-${Date.now()}-2`, input: "", expectedOutput: "", isHidden: true, description: "Hidden test" },
            ],
        };
        onChange([...questions, newQ]);
        setExpandedIdx(questions.length);
    };

    const removeQuestion = (idx: number) => {
        onChange(questions.filter((_, i) => i !== idx));
        if (expandedIdx === idx) setExpandedIdx(null);
        else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
    };

    const updateQuestion = (idx: number, updates: Partial<CodingQ>) => {
        onChange(questions.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
    };

    const addTestCase = (qIdx: number) => {
        const q = questions[qIdx];
        const tc: CodingTestCase = { id: `tc-${Date.now()}`, input: "", expectedOutput: "", isHidden: false, description: "" };
        updateQuestion(qIdx, { testCases: [...q.testCases, tc] });
    };

    const removeTestCase = (qIdx: number, tcIdx: number) => {
        const q = questions[qIdx];
        updateQuestion(qIdx, { testCases: q.testCases.filter((_, i) => i !== tcIdx) });
    };

    const updateTestCase = (qIdx: number, tcIdx: number, updates: Partial<CodingTestCase>) => {
        const q = questions[qIdx];
        const newTcs = q.testCases.map((tc, i) => (i === tcIdx ? { ...tc, ...updates } : tc));
        updateQuestion(qIdx, { testCases: newTcs });
    };

    const updateStarterCode = (qIdx: number, lang: string, code: string) => {
        const q = questions[qIdx];
        updateQuestion(qIdx, { starterCode: { ...q.starterCode, [lang]: code } });
    };

    const addTag = (qIdx: number, tag: string) => {
        const q = questions[qIdx];
        if (tag && !q.tags.includes(tag)) {
            updateQuestion(qIdx, { tags: [...q.tags, tag] });
        }
    };

    const removeTag = (qIdx: number, tag: string) => {
        const q = questions[qIdx];
        updateQuestion(qIdx, { tags: q.tags.filter(t => t !== tag) });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-semibold text-text-primary text-sm">Coding Problems</h3>
                    <p className="text-xs text-text-muted">{questions.length} problem(s) added</p>
                </div>
                <Button variant="primary" size="sm" onClick={addQuestion} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Problem
                </Button>
            </div>

            {questions.length === 0 && (
                <div className="text-center py-8 text-text-muted border border-dashed border-white/10 rounded-xl">
                    <Code2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No coding problems yet. Click "Add Problem" to create one.</p>
                </div>
            )}

            {questions.map((q, idx) => {
                const isExpanded = expandedIdx === idx;
                return (
                    <div key={q.id} className="glass rounded-xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/3 transition-colors"
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}>
                            <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-xs font-bold text-neon-cyan flex-shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">{q.title || "Untitled Problem"}</p>
                                <p className="text-xs text-text-muted">{q.difficulty} · {q.points} pts · {q.testCases.length} test cases</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                                className="text-text-muted hover:text-red-400 transition-colors p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-white/8 space-y-4">
                                {/* Title & Function Name */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Problem Title</label>
                                        <input type="text" placeholder="e.g., Two Sum" value={q.title}
                                            onChange={(e) => updateQuestion(idx, { title: e.target.value })}
                                            className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Function Name</label>
                                        <input type="text" placeholder="e.g., twoSum" value={q.functionName}
                                            onChange={(e) => updateQuestion(idx, { functionName: e.target.value })}
                                            className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 font-mono focus:outline-none focus:border-neon-cyan/50" />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Problem Description</label>
                                    <textarea rows={5} placeholder="Describe the problem, constraints, examples..."
                                        value={q.description}
                                        onChange={(e) => updateQuestion(idx, { description: e.target.value })}
                                        className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 resize-none font-mono" />
                                </div>

                                {/* Difficulty & Points */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Difficulty</label>
                                        <select value={q.difficulty}
                                            onChange={(e) => updateQuestion(idx, { difficulty: e.target.value as Difficulty })}
                                            className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50">
                                            <option>Easy</option><option>Medium</option><option>Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Points</label>
                                        <input type="number" value={q.points} min={1}
                                            onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) || 100 })}
                                            className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50" />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Tags</label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {q.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-xs text-neon-cyan flex items-center gap-1">
                                                {tag}
                                                <button onClick={() => removeTag(idx, tag)} className="hover:text-red-400">×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Type tag and press Enter (e.g., Array, HashMap)"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTag(idx, (e.target as HTMLInputElement).value.trim());
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }}
                                        className="w-full bg-surface-2 border border-border rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-neon-cyan/50" />
                                </div>

                                {/* Starter Code */}
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Starter Code</label>
                                    <div className="flex gap-1 mb-2">
                                        {["javascript", "python", "cpp"].map(lang => (
                                            <button key={lang} onClick={() => setActiveCodeLang(lang)}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeCodeLang === lang
                                                    ? "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan"
                                                    : "glass border border-white/10 text-text-muted hover:border-white/20"}`}>
                                                {lang === "cpp" ? "C++" : lang === "javascript" ? "JS" : "Python"}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea rows={6} value={q.starterCode[activeCodeLang] || ""}
                                        onChange={(e) => updateStarterCode(idx, activeCodeLang, e.target.value)}
                                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl text-sm text-neon-green/90 px-4 py-3 focus:outline-none focus:border-neon-cyan/50 resize-none font-mono leading-relaxed" />
                                </div>

                                {/* Test Cases */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs text-text-muted">Test Cases ({q.testCases.length})</label>
                                        <button onClick={() => addTestCase(idx)}
                                            className="text-xs text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1 transition-colors">
                                            <Plus className="w-3 h-3" /> Add Test Case
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {q.testCases.map((tc, tcIdx) => (
                                            <div key={tc.id} className={`p-3 rounded-xl border ${tc.isHidden ? "border-orange-400/20 bg-orange-400/5" : "border-white/10 bg-white/3"}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-text-muted">
                                                        Test Case {tcIdx + 1} {tc.isHidden && <span className="text-orange-400">(Hidden)</span>}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => updateTestCase(idx, tcIdx, { isHidden: !tc.isHidden })}
                                                            className={`text-xs flex items-center gap-1 transition-colors ${tc.isHidden ? "text-orange-400" : "text-text-muted hover:text-orange-400"}`}>
                                                            {tc.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                            {tc.isHidden ? "Hidden" : "Visible"}
                                                        </button>
                                                        {q.testCases.length > 1 && (
                                                            <button onClick={() => removeTestCase(idx, tcIdx)}
                                                                className="text-text-muted hover:text-red-400 transition-colors">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <input type="text" placeholder="Description (optional)" value={tc.description}
                                                    onChange={(e) => updateTestCase(idx, tcIdx, { description: e.target.value })}
                                                    className="w-full bg-surface-2 border border-border rounded-lg text-xs text-text-primary px-3 py-1.5 mb-2 focus:outline-none focus:border-neon-cyan/50" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-text-muted mb-1 block">Input</label>
                                                        <textarea rows={2} placeholder="e.g., [2,7,11,15]\n9" value={tc.input}
                                                            onChange={(e) => updateTestCase(idx, tcIdx, { input: e.target.value })}
                                                            className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg text-xs text-neon-cyan/80 px-3 py-2 focus:outline-none focus:border-neon-cyan/50 resize-none font-mono" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-text-muted mb-1 block">Expected Output</label>
                                                        <textarea rows={2} placeholder="e.g., [0,1]" value={tc.expectedOutput}
                                                            onChange={(e) => updateTestCase(idx, tcIdx, { expectedOutput: e.target.value })}
                                                            className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg text-xs text-neon-green/80 px-3 py-2 focus:outline-none focus:border-neon-cyan/50 resize-none font-mono" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
                    <Plus className="w-4 h-4" /> Add Another Problem
                </button>
            )}
        </div>
    );
}
