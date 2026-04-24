"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
    Play, CheckCircle2, XCircle, Brain,
    Lightbulb, ArrowRight, Terminal, EyeOff,
    Zap, TrendingUp, AlertCircle, Sparkles
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Navbar from "@/components/layout/Navbar";
import { mockCodingQuestions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { generateCodingFeedback, buildCodingResult, saveToStorage, STORAGE_KEYS } from "@/lib/ai-feedback";
import type { CodingQuestionFeedback } from "@/lib/types";

import dynamic from "next/dynamic";
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false, loading: () => (
        <div className="flex-1 bg-surface shimmer-bg animate-shimmer" />
    )
});

// ── Language config ────────────────────────────────────────────────────────────
type LangId = "javascript" | "python" | "c" | "cpp" | "java" | "go" | "typescript" | "rust" | "ruby" | "csharp" | "php";
const LANGUAGES: { id: LangId; label: string; ext: string; monacoId: string }[] = [
    { id: "javascript",  label: "JavaScript",  ext: "js",     monacoId: "javascript"  },
    { id: "typescript",  label: "TypeScript",   ext: "ts",     monacoId: "typescript"  },
    { id: "python",      label: "Python",       ext: "py",     monacoId: "python"      },
    { id: "c",           label: "C",            ext: "c",      monacoId: "c"           },
    { id: "cpp",         label: "C++",          ext: "cpp",    monacoId: "cpp"         },
    { id: "java",        label: "Java",         ext: "java",   monacoId: "java"        },
    { id: "go",          label: "Go",           ext: "go",     monacoId: "go"          },
    { id: "rust",        label: "Rust",         ext: "rs",     monacoId: "rust"        },
    { id: "ruby",        label: "Ruby",         ext: "rb",     monacoId: "ruby"        },
    { id: "csharp",      label: "C#",           ext: "cs",     monacoId: "csharp"      },
    { id: "php",         label: "PHP",          ext: "php",    monacoId: "php"         },
];

/** Execution output from /api/execute */
interface ExecOutput {
    stdout?: string;
    stderr?: string;
    compile_error?: string;
    status?: "success" | "compile_error" | "runtime_error" | "timeout" | "error";
    exit_code?: number;
    error?: string;
    time?: string;
    memory?: string;
    testResults?: {
        passed: number;
        total: number;
        results: { id: number; passed: boolean; expected?: string; got?: string }[];
    };
}

export default function CodingRoundPage() {
    const params = useParams();
    const [currentQ, setCurrentQ] = useState(0);
    const [code, setCode] = useState(typeof mockCodingQuestions[0].starterCode === 'object' ? mockCodingQuestions[0].starterCode.javascript : mockCodingQuestions[0].starterCode || "");
    const [activeTab, setActiveTab] = useState<"problem" | "hints" | "ai">("problem");
    const [testResults, setTestResults] = useState<null | { passed: number; total: number; results: boolean[]; isSubmitResult: boolean; compileError?: boolean; runtimeError?: boolean; errorMessage?: string }>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<CodingQuestionFeedback | null>(null);
    const [allFeedbacks, setAllFeedbacks] = useState<CodingQuestionFeedback[]>([]);
    const [language, setLanguage] = useState<LangId>("javascript");
    const [stdinInput, setStdinInput] = useState("");
    const [showStdin, setShowStdin] = useState(false);
    const [execOutput, setExecOutput] = useState<ExecOutput | null>(null);
    const [runTimedOut, setRunTimedOut] = useState(false);

    const q = mockCodingQuestions[currentQ];

    const checkBoilerplate = () => {
        const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
        const currentStarter = typeof q.starterCode === 'object' ? q.starterCode[language] : q.starterCode;
        const cleanStarter = (currentStarter || "").replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
        if (!cleanCode || cleanCode === cleanStarter || cleanCode.length < 10) {
            toast.error("Please write a valid solution before submitting");
            return true;
        }
        return false;
    };

    const runCode = async () => {
        if (!code.trim()) {
            toast.error("Please write some code first");
            return;
        }

        setIsRunning(true);
        setExecOutput(null);
        setTestResults(null);
        setRunTimedOut(false);

        // 15-second client-side timeout
        const controller = new AbortController();
        const clientTimeout = setTimeout(() => {
            controller.abort();
            setRunTimedOut(true);
        }, 15000);

        try {
            const res = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code, language,
                    stdin: stdinInput,
                    functionName: q.functionName,
                    testCases: q.testCases,
                }),
                signal: controller.signal,
            });
            clearTimeout(clientTimeout);

            const data: ExecOutput = await res.json();

            // Show stdin hint if code likely needs input but stdin is empty
            if (data.status === 'runtime_error' && !stdinInput &&
                (data.stderr?.includes('EOFError') || data.stderr?.includes('NoSuchElementException') || data.stderr?.includes('scanf'))) {
                toast("Your code requires input — use the stdin box below", { icon: "💡" });
                setShowStdin(true);
            }

            setExecOutput(data);
            setRunTimedOut(false);
        } catch (err: any) {
            clearTimeout(clientTimeout);
            if (err.name === 'AbortError') {
                setExecOutput({
                    error: 'Execution timed out. Please check for infinite loops.',
                });
                setRunTimedOut(true);
            } else {
                setExecOutput({
                    error: 'Something went wrong — please try again',
                });
            }
        } finally {
            setIsRunning(false);
        }
    };

    const submitCode = async () => {
        if (checkBoilerplate()) {
            // Trigger 0 score pipeline natively
            const totalTests = q.testCases?.length || 3;
            const feedback = generateCodingFeedback(q, code, 0, totalTests, true);
            
            setAllFeedbacks([...allFeedbacks.filter(f => f.questionId !== q.id), feedback]);
            setAiFeedback(feedback);
            setTestResults({ passed: 0, total: totalTests, results: (q.testCases || []).map(() => false), isSubmitResult: true });
            setActiveTab("ai");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, testCases: q.testCases || [], language })
            });
            const data = await res.json();
            
            const totalTests = q.testCases?.length || 3;
            const passed = data.passed || 0;
            const feedback = generateCodingFeedback(q, code, passed, totalTests, false);

            setAllFeedbacks([...allFeedbacks.filter(f => f.questionId !== q.id), feedback]);
            setAiFeedback(feedback);

            setTestResults({
                passed,
                total: totalTests,
                results: data.results || (q.testCases || []).map(() => false),
                isSubmitResult: true,
                compileError: data.compileError,
                runtimeError: data.runtimeError,
                errorMessage: data.error,
            });
            setActiveTab("ai");
        } catch (error) {
            toast.error("Submission failed. Unable to evaluate code.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextProblem = () => {
        const nextIdx = currentQ + 1;
        setCurrentQ(nextIdx);
        const nextStarter = mockCodingQuestions[nextIdx]?.starterCode;
        setCode(typeof nextStarter === 'object' ? nextStarter[language] : nextStarter || "");
        setTestResults(null);
        setExecOutput(null);
        setAiFeedback(null);
        setActiveTab("problem");
    };

    const handleFinishRound = () => {
        const result = buildCodingResult(allFeedbacks);
        saveToStorage(STORAGE_KEYS.coding, result);
        setSubmitted(true);
    };

    const codingScore = allFeedbacks.length > 0
        ? Math.round(allFeedbacks.reduce((a, f) => a + f.score, 0) / allFeedbacks.length)
        : 0;

    if (submitted) {
        return (
            <div className="min-h-screen">
                <Navbar role="student" userName="Arjun Mehta" />
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-neon-green/20 border-2 border-neon-green/40 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-neon-green" />
                    </div>
                    <h1 className="text-3xl font-bold font-display mb-2">Coding Round Done!</h1>
                    <p className="text-text-muted mb-2">{mockCodingQuestions.length} problems attempted</p>

                    {/* Overall coding score */}
                    <div className="inline-flex flex-col items-center px-8 py-4 mb-6 rounded-2xl bg-gradient-to-br from-neon-green/10 to-neon-cyan/10 border border-neon-green/30">
                        <div className="text-5xl font-bold text-neon-green font-display">{codingScore}</div>
                        <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Overall Coding Score / 100</div>
                        <div className="flex gap-4 mt-3">
                            {allFeedbacks.map((f, i) => (
                                <div key={f.questionId} className="text-center">
                                    <div className="text-sm font-bold text-neon-cyan">{f.score}</div>
                                    <div className="text-xs text-text-muted">Q{i + 1}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <Link href={`/interview/${params.id}/hr`}>
                            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>Continue to HR Round</Button>
                        </Link>
                        <Link href={`/interview/${params.id}/results`}>
                            <Button variant="secondary">Skip to Results</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentLang = LANGUAGES.find(l => l.id === language);

    return (
        <div className="h-screen flex flex-col">
            <Navbar role="student" userName="Arjun Mehta" />

            <div className="flex-1 flex overflow-hidden">

                {/* ── Left Panel ── */}
                <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-white/8">

                    {/* Question selector */}
                    <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2 flex-wrap">
                        {mockCodingQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentQ(i);
                                    const nextStarter = mockCodingQuestions[i].starterCode;
                                    setCode(typeof nextStarter === 'object' ? nextStarter[language] : nextStarter || "");
                                    setTestResults(null);
                                    setExecOutput(null);
                                    setAiFeedback(null);
                                    setActiveTab("problem");
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                    currentQ === i
                                        ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                                        : allFeedbacks.find(f => f.questionId === mockCodingQuestions[i].id)
                                            ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                                            : "glass border-white/10 text-text-muted hover:border-white/20"
                                )}
                            >
                                Q{i + 1} {allFeedbacks.find(f => f.questionId === mockCodingQuestions[i].id) ? "✓" : ""}
                            </button>
                        ))}
                        <Badge variant={q.difficulty === "Easy" ? "green" : q.difficulty === "Hard" ? "red" : "yellow"} size="sm">
                            {q.difficulty}
                        </Badge>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/8">
                        {(["problem", "hints", "ai"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 px-3 py-2.5 text-xs font-semibold capitalize transition-all relative",
                                    tab === activeTab ? "text-neon-cyan tab-active" : "text-text-muted hover:text-text-secondary"
                                )}
                            >
                                {tab === "ai" ? "🤖 AI Review" : tab === "hints" ? "💡 Hints" : "📝 Problem"}
                                {tab === "ai" && aiFeedback && (
                                    <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-neon-green" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-y-auto p-4">

                        {activeTab === "problem" && (
                            <div>
                                <h2 className="font-bold text-text-primary mb-1">{q.title}</h2>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {q.tags.map(tag => (
                                        <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                                    ))}
                                </div>
                                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                                    {q.description}
                                </div>
                                <div className="mt-6">
                                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Test Cases</div>
                                    {q.testCases?.filter(tc => !tc.isHidden).map((tc, i) => (
                                        <div key={tc.id} className="mb-3 glass rounded-xl border border-white/8 p-3">
                                            <div className="text-xs text-text-muted mb-1">Example {i + 1}: {tc.description}</div>
                                            <div className="font-mono text-xs">
                                                <div className="text-text-muted">Input: <span className="text-neon-cyan">{tc.input}</span></div>
                                                <div className="text-text-muted">Output: <span className="text-neon-green">{tc.expectedOutput}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                                        <EyeOff className="w-3.5 h-3.5" />
                                        {q.testCases?.filter(tc => tc.isHidden).length} hidden test cases
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "hints" && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                                    <span className="font-semibold text-yellow-400 text-sm">AI Hints</span>
                                    <Badge variant="yellow" size="sm">-5 pts each</Badge>
                                </div>
                                <div className="space-y-3">
                                    {q.aiHints?.map((hint, i) => (
                                        <div key={i} className="p-3 glass rounded-xl border border-yellow-400/20">
                                            <div className="text-xs text-yellow-300/70 mb-1">Hint {i + 1}</div>
                                            <div className="text-sm text-text-secondary">{hint}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "ai" && (
                            <div>
                                {!aiFeedback ? (
                                    <div className="text-center py-10 text-text-muted">
                                        <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">Submit your code to unlock</p>
                                        <p className="text-xs mt-1 opacity-60">Click &quot;Submit &amp; Analyze&quot; to get a full AI code review</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Score */}
                                        <div className="text-center p-4 bg-gradient-to-br from-neon-green/5 to-neon-cyan/5 border border-neon-green/20 rounded-xl">
                                            <div className="text-4xl font-bold text-neon-green font-display mb-1">{aiFeedback.score}/100</div>
                                            <div className="text-xs text-text-muted">AI Code Score</div>
                                            <div className="flex items-center justify-center gap-1 mt-2">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Sparkles key={i} className={cn("w-3 h-3", i < Math.round(aiFeedback.score / 20) ? "text-yellow-400" : "text-white/10")} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Complexity */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="glass rounded-xl border border-white/10 p-3 text-center">
                                                <div className="text-sm font-bold text-neon-cyan">{aiFeedback.timeComplexity}</div>
                                                <div className="text-xs text-text-muted">Time</div>
                                            </div>
                                            <div className="glass rounded-xl border border-white/10 p-3 text-center">
                                                <div className="text-sm font-bold text-neon-purple">{aiFeedback.spaceComplexity}</div>
                                                <div className="text-xs text-text-muted">Space</div>
                                            </div>
                                        </div>

                                        {/* What you did well */}
                                        <div className="p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
                                                <span className="text-xs font-semibold text-neon-green uppercase tracking-wider">What You Did Well</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {aiFeedback.didWell.map((s, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                                        <span className="text-neon-green mt-0.5 flex-shrink-0">✓</span>{s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Improve */}
                                        <div className="p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                                                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">What To Improve</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {aiFeedback.improve.map((s, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                                        <span className="text-yellow-400 mt-0.5 flex-shrink-0">⚡</span>{s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Model Approach */}
                                        <div className="p-3 rounded-xl bg-neon-purple/5 border border-neon-purple/20">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Brain className="w-3.5 h-3.5 text-neon-purple" />
                                                <span className="text-xs font-semibold text-neon-purple uppercase tracking-wider">Model Approach</span>
                                            </div>
                                            <p className="text-xs text-text-secondary leading-relaxed">{aiFeedback.modelApproach}</p>
                                        </div>

                                        {/* Edge Cases */}
                                        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Edge Cases to Watch</span>
                                            </div>
                                            <div className="space-y-1">
                                                {aiFeedback.edgeCases.map((ec, i) => (
                                                    <div key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                                                        <span className="text-red-400 flex-shrink-0">•</span>{ec}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
                {/* ── End Left Panel ── */}

                {/* ── Right Panel - Editor ── */}
                <div className="flex-1 flex flex-col">

                    {/* Editor header */}
                    <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* macOS-style dots */}
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-neon-green/60" />
                            </div>
                            {/* Dynamic filename */}
                            <span className="text-xs text-text-muted font-mono ml-2">
                                {`solution.${currentLang?.ext ?? "js"}`}
                            </span>
                            {/* FIX: language selector dropdown */}
                            <select
                                value={language}
                                onChange={e => {
                                    const newLang = e.target.value as LangId;
                                    setLanguage(newLang);
                                    const currentStarterCode = q.starterCode;
                                    if (typeof currentStarterCode === 'object' && currentStarterCode[newLang]) {
                                        setCode(currentStarterCode[newLang]);
                                    }
                                }}
                                className="ml-2 text-xs bg-surface border border-white/10 text-text-secondary rounded-lg px-2 py-1 cursor-pointer hover:border-neon-cyan/40 focus:outline-none focus:border-neon-cyan/60 transition-colors"
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.id} value={l.id}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />}
                                isLoading={isRunning} disabled={isRunning || isSubmitting} onClick={runCode}>Run</Button>
                            <Button variant="neon-green" size="sm" isLoading={isSubmitting} disabled={isRunning || isSubmitting} onClick={submitCode}>
                                Submit &amp; Analyze
                            </Button>
                            {aiFeedback && currentQ < mockCodingQuestions.length - 1 && (
                                <Button variant="primary" size="sm" onClick={handleNextProblem}
                                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                                    Next Problem
                                </Button>
                            )}
                            {allFeedbacks.length > 0 && (
                                <Button variant="neon-green" size="sm" onClick={handleFinishRound}
                                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                                    Finish Round
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Monaco editor with dynamic language */}
                    <div className="flex-1 overflow-hidden">
                        <MonacoEditor
                            height="100%"
                            language={currentLang?.monacoId ?? "javascript"}
                            theme="vs-dark"
                            value={code}
                            onChange={v => setCode(v || "")}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                lineNumbers: "on",
                                wordWrap: "on",
                                scrollBeyondLastLine: false,
                                renderLineHighlight: "all",
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                fontLigatures: true,
                                cursorBlinking: "smooth",
                                smoothScrolling: true,
                                padding: { top: 16, bottom: 16 },
                            }}
                        />
                    </div>

                    {/* Stdin input (collapsible) */}
                    <div className="border-t border-white/8">
                        <button
                            onClick={() => setShowStdin(!showStdin)}
                            className="w-full px-4 py-1.5 text-xs text-text-muted hover:text-text-secondary flex items-center gap-1.5 transition-colors"
                        >
                            <Terminal className="w-3 h-3" />
                            stdin {showStdin ? '▾' : '▸'}
                        </button>
                        {showStdin && (
                            <textarea
                                value={stdinInput}
                                onChange={e => setStdinInput(e.target.value)}
                                placeholder="Enter input for your program here (one value per line)..."
                                className="w-full px-4 py-2 bg-black/30 text-xs font-mono text-text-secondary border-t border-white/5 resize-none focus:outline-none placeholder:text-white/20"
                                rows={3}
                            />
                        )}
                    </div>

                    {/* ── Output Panel ── */}
                    {(execOutput || testResults) && (
                        <div className="border-t border-white/8 p-4 max-h-[280px] overflow-y-auto">

                            {/* Execution Output (from Run button) */}
                            {execOutput && (
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Terminal className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-sm font-semibold">Output</span>
                                        {execOutput.time && (
                                            <Badge variant="default" size="sm">⏱ {execOutput.time}</Badge>
                                        )}
                                        {execOutput.memory && (
                                            <Badge variant="default" size="sm">💾 {execOutput.memory}</Badge>
                                        )}
                                        {execOutput.status === 'success' && <Badge variant="green" size="sm">✓ Success</Badge>}
                                        {execOutput.status === 'compile_error' && <Badge variant="red" size="sm">Compilation Error</Badge>}
                                        {execOutput.status === 'runtime_error' && <Badge variant="red" size="sm">Runtime Error</Badge>}
                                        {execOutput.status === 'error' && <Badge variant="red" size="sm">Error</Badge>}
                                    </div>

                                    {/* Service-level error (e.g., API unavailable) */}
                                    {execOutput.error && (
                                        <pre className="text-xs font-mono text-red-300/90 bg-red-500/8 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap leading-relaxed mb-2">{execOutput.error}</pre>
                                    )}

                                    {/* Compile error */}
                                    {execOutput.compile_error && (
                                        <div className="mb-2">
                                            <div className="text-xs font-semibold text-red-400 mb-1">🔴 Compilation Failed</div>
                                            <pre className="text-xs font-mono text-red-300/90 bg-red-500/8 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">{execOutput.compile_error}</pre>
                                        </div>
                                    )}

                                    {/* Stderr / runtime error */}
                                    {execOutput.stderr && !execOutput.compile_error && (
                                        <div className="mb-2">
                                            <div className="text-xs font-semibold text-red-400 mb-1">🔴 Runtime Error</div>
                                            <pre className="text-xs font-mono text-red-300/90 bg-red-500/8 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">{execOutput.stderr}</pre>
                                        </div>
                                    )}

                                    {/* ── LeetCode-style test results ── */}
                                    {execOutput.testResults && (
                                        <div className="mb-3">
                                            <div className="text-xs font-semibold text-text-secondary mb-2">
                                                {execOutput.testResults.passed}/{execOutput.testResults.total} test cases passed
                                            </div>
                                            <div className="space-y-1.5">
                                                {execOutput.testResults.results.map((r) => (
                                                    <div key={r.id} className={`text-xs font-mono rounded-lg p-2.5 border ${
                                                        r.passed
                                                            ? 'bg-neon-green/5 border-neon-green/20 text-neon-green'
                                                            : 'bg-red-500/8 border-red-500/20 text-red-300'
                                                    }`}>
                                                        <div className="font-semibold">
                                                            {r.passed ? '✓' : '✗'} Test Case {r.id}: {r.passed ? 'PASSED' : 'FAILED'}
                                                        </div>
                                                        {!r.passed && r.expected && (
                                                            <div className="mt-1 text-red-400/80">
                                                                <div>Expected: {r.expected}</div>
                                                                <div>Got: {r.got}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Stdout (only show raw if no test results) */}
                                    {!execOutput.testResults && execOutput.stdout ? (
                                        <pre className="text-xs font-mono text-neon-green/90 bg-neon-green/5 border border-neon-green/20 rounded-lg p-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">{execOutput.stdout}</pre>
                                    ) : !execOutput.testResults && execOutput.status === 'success' && !execOutput.compile_error && !execOutput.stderr && !execOutput.error ? (
                                        <pre className="text-xs font-mono text-text-muted bg-white/3 border border-white/10 rounded-lg p-3">Code ran successfully with no output.</pre>
                                    ) : null}

                                    {/* Retry button on timeout */}
                                    {runTimedOut && (
                                        <button onClick={runCode} className="mt-2 text-xs text-neon-cyan hover:underline">🔄 Retry</button>
                                    )}
                                </div>
                            )}

                            {/* Test Results (from Submit button) */}
                            {testResults && (
                                <div>
                                    {(testResults.compileError || testResults.runtimeError) && testResults.errorMessage ? (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Terminal className="w-4 h-4 text-red-400" />
                                                <span className="text-sm font-semibold text-red-400">
                                                    {testResults.compileError ? '🔴 Compilation Error' : '🟠 Runtime Error'}
                                                </span>
                                            </div>
                                            <pre className="text-xs font-mono text-red-300/90 bg-red-500/8 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">{testResults.errorMessage}</pre>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 mb-3">
                                                <Terminal className="w-4 h-4 text-neon-cyan" />
                                                <span className="text-sm font-semibold">Test Results</span>
                                                {(() => {
                                                    const visibleTests = q.testCases?.filter(tc => !tc.isHidden) || [];
                                                    const visiblePassed = testResults.results.filter((p, idx) => p && !q.testCases?.[idx]?.isHidden).length;
                                                    const displayPassed = testResults.isSubmitResult ? testResults.passed : visiblePassed;
                                                    const displayTotal = testResults.isSubmitResult ? testResults.total : visibleTests.length;
                                                    const allVisiblePassed = displayPassed === displayTotal;
                                                    return (
                                                        <>
                                                            <Badge variant={allVisiblePassed ? "green" : "yellow"}>
                                                                {displayPassed}/{displayTotal} {!testResults.isSubmitResult ? 'visible ' : ''}passed
                                                            </Badge>
                                                            {testResults.isSubmitResult && testResults.passed === testResults.total && (
                                                                <span className="text-xs text-neon-green flex items-center gap-1"><Zap className="w-3 h-3" />All tests passed!</span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div className="space-y-2">
                                                {q.testCases?.map((tc, i) => {
                                                    const passed = testResults.results[i];
                                                    const isHidden = tc.isHidden;
                                                    const notEvaluated = isHidden && !testResults.isSubmitResult;
                                                    return (
                                                        <div key={tc.id} className={cn(
                                                            "flex items-center gap-3 text-xs p-2 rounded-lg",
                                                            notEvaluated ? "bg-white/3 border border-white/10"
                                                                : passed ? "bg-neon-green/5 border border-neon-green/20"
                                                                    : "bg-red-500/5 border border-red-500/20"
                                                        )}>
                                                            {notEvaluated
                                                                ? <EyeOff className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                                                                : passed
                                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
                                                                    : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                                                            <span className="text-text-secondary">
                                                                Test {i + 1}{isHidden ? ' (hidden)' : ''}: {notEvaluated ? 'Not Evaluated' : passed ? 'Passed ✓' : 'Failed ✗'}
                                                            </span>
                                                            {!isHidden && !passed && (
                                                                <span className="ml-auto text-text-muted">Expected: {tc.expectedOutput}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
                {/* ── End Right Panel ── */}

            </div>
        </div>
    );
}
