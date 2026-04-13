"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Filter, Star, Users, Clock, Brain, Play, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { practiceTemplates } from "@/lib/mock-data";

const techFilters = ["All", "Frontend", "Backend", "DSA", "AI/ML", "HR"];
const diffFilters = ["All", "Easy", "Medium", "Hard"];

const colorMap: Record<string, any> = {
    cyan: "cyan", purple: "purple", green: "green", orange: "orange", blue: "blue", pink: "pink"
};

export default function StudentPracticePage() {
    const [search, setSearch] = useState("");
    const [techFilter, setTechFilter] = useState("All");
    const [diffFilter, setDiffFilter] = useState("All");

    const filtered = practiceTemplates.filter(t => {
        const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase());
        const matchDiff = diffFilter === "All" || t.difficulty === diffFilter;
        return matchSearch && matchDiff;
    });

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName="Arjun Mehta" />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold font-display">Practice Interviews</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Choose a template and get AI feedback instantly</p>
                </div>

                {/* AI Suggestion Banner */}
                <div className="glass rounded-2xl border border-neon-purple/20 p-5 mb-6 bg-gradient-to-r from-neon-purple/5 to-neon-cyan/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-background" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-text-primary text-sm mb-0.5">AI Recommends: DSA Interview Prep</div>
                        <p className="text-xs text-text-muted">Based on your weak spots in Trees & Dynamic Programming — 92% improvement for this pattern</p>
                    </div>
                    <Link href="/interview/pt-2">
                        <Button variant="neon-purple" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                            Practice Now
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1">
                        <Input placeholder="Search practice templates..." value={search}
                            onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
                    </div>
                    <div className="flex gap-1.5">
                        {diffFilters.map(f => (
                            <button key={f} onClick={() => setDiffFilter(f)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${diffFilter === f ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan" : "glass border-white/10 text-text-muted hover:border-white/20"
                                    }`}>{f}</button>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((t) => (
                        <div key={t.id} className="glass rounded-2xl border border-white/8 p-5 hover:border-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant={colorMap[t.color] || "default"} size="sm">{t.difficulty}</Badge>
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                    {t.rating}
                                    <span className="ml-2 flex gap-1">
                                        {Array.from({ length: Math.round(t.rating) }).map((_, i) => (
                                            <span key={i} className={`w-1.5 h-1.5 rounded-full bg-neon-${t.color}/60`} />
                                        ))}
                                    </span>
                                </div>
                            </div>

                            {/* Title & Desc */}
                            <h3 className={`font-bold text-text-primary mb-1 group-hover:text-neon-${t.color} transition-colors`}>{t.title}</h3>
                            <p className="text-xs text-text-muted leading-relaxed mb-4 flex-1">{t.description}</p>

                            {/* Tech Stack */}
                            {t.techStack.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {t.techStack.map(stack => (
                                        <span key={stack} className="text-xs px-2 py-0.5 glass rounded-md border border-white/10 text-text-muted">{stack}</span>
                                    ))}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duration}m</span>
                                <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{t.rounds} rounds</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(t.attempts / 1000).toFixed(0)}K attempts</span>
                            </div>

                            <Link href={`/interview/${t.id}`} className="block">
                                <Button variant={`neon-${t.color}` as any} size="md" className="w-full"
                                    leftIcon={<Play className="w-4 h-4" />}>
                                    Start Practice
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
