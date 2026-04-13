"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    Brain,
    ArrowRight,
    Play,
    Star,
    Users,
    Trophy,
    Zap,
    Code2,
    Mic,
    BarChart3,
    CheckCircle,
    ChevronRight,
    Sparkles,
    Target,
    Shield,
    TrendingUp,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const stats = [
    { label: "Active Users", value: "50,000+", icon: Users },
    { label: "Interviews Created", value: "12,000+", icon: Brain },
    { label: "Success Rate", value: "87%", icon: Trophy },
    { label: "AI Questions", value: "1M+", icon: Zap },
];

const features = [
    {
        icon: Brain,
        title: "AI Question Generation",
        description: "Dynamically generated questions based on role, difficulty, and tech stack. Never repeat the same interview twice.",
        color: "cyan",
        gradient: "from-neon-cyan/20 to-transparent",
    },
    {
        icon: Code2,
        title: "Real Coding Environment",
        description: "Monaco editor with syntax highlighting, test cases, and AI-powered code review with complexity analysis.",
        color: "purple",
        gradient: "from-neon-purple/20 to-transparent",
    },
    {
        icon: Mic,
        title: "AI HR Interviewer",
        description: "Practice with an AI interviewer that scores communication, confidence, and response quality in real time.",
        color: "green",
        gradient: "from-neon-green/20 to-transparent",
    },
    {
        icon: BarChart3,
        title: "Deep Analytics",
        description: "Score breakdowns, skill heatmaps, progress tracking, and personalized improvement suggestions.",
        color: "orange",
        gradient: "from-neon-orange/20 to-transparent",
    },
    {
        icon: Shield,
        title: "Anti-Cheat System",
        description: "Tab switch detection, focus monitoring, and optional camera verification for fair assessments.",
        color: "blue",
        gradient: "from-neon-blue/20 to-transparent",
    },
    {
        icon: Trophy,
        title: "Gamification",
        description: "XP system, streaks, badges, and global leaderboard keep students motivated and engaged.",
        color: "pink",
        gradient: "from-neon-pink/20 to-transparent",
    },
];

const testimonials = [
    {
        name: "Ananya Krishnan",
        role: "Software Engineer @ Google",
        text: "AiMock's AI feedback was incredibly accurate. I improved my DSA score by 40% in 2 weeks and landed my dream job!",
        avatar: "A",
        rating: 5,
    },
    {
        name: "Rohit Malhotra",
        role: "Engineering Manager @ Stripe",
        text: "We use AiMock for all our hiring rounds. The AI question quality is exceptional and saves our team 10+ hours per week.",
        avatar: "R",
        rating: 5,
    },
    {
        name: "Layla Hassan",
        role: "ML Engineer @ DeepMind",
        text: "The confidentiality and anti-cheat features give us confidence. Best hiring tool we've adopted in years.",
        avatar: "L",
        rating: 5,
    },
];

const howItWorks = [
    { step: "01", title: "Create or Join", desc: "Recruiters build custom interview rounds. Students join or practice freely.", icon: Target },
    { step: "02", title: "Take the Interview", desc: "Attempt aptitude, coding, and HR rounds powered by AI.", icon: Play },
    { step: "03", title: "Get AI Feedback", desc: "Receive detailed analysis, scores, and improvement tips instantly.", icon: Sparkles },
    { step: "04", title: "Track & Improve", desc: "Monitor your progress with analytics and climb the leaderboard.", icon: TrendingUp },
];

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Hero */}
            <section className="relative pt-20 pb-32 px-4 overflow-hidden">
                {/* Animated grid background */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,245,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Center glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px]" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <Badge variant="cyan" className="mb-6 mx-auto">
                            <Sparkles className="w-3 h-3" />
                            Powered by Advanced AI
                        </Badge>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-tight mb-6">
                            The Future of
                            <br />
                            <span className="gradient-text-cyan text-glow-cyan">AI Interviews</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                            Recruiter-grade hiring platform meets student-ready practice mode.
                            Multi-round AI interviews with real-time scoring, code execution, and
                            deep analytics.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/auth/signup?role=student">
                                <Button variant="primary" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                                    Start Practicing Free
                                </Button>
                            </Link>
                            <Link href="/auth/signup?role=recruiter">
                                <Button variant="outline" size="xl" leftIcon={<Play className="w-4 h-4" />}>
                                    For Recruiters
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Hero cards - floating */}
                    <div className="mt-20 relative">
                        {/* Main preview card */}
                        <div
                            className="glass rounded-2xl border border-white/10 p-1 shadow-glass max-w-3xl mx-auto animate-float"
                            style={{ animationDelay: "0s" }}
                        >
                            {/* Fake editor header */}
                            <div className="bg-surface-2 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                    <span className="ml-3 text-xs text-text-muted font-mono">coding-round.js</span>
                                    <div className="ml-auto flex items-center gap-2">
                                        <Badge variant="green" dot>Test Passed</Badge>
                                    </div>
                                </div>
                                <div className="font-mono text-sm text-left space-y-1">
                                    <div><span className="text-neon-purple">function</span> <span className="text-neon-cyan">twoSum</span><span className="text-text-muted">(nums, target) {"{"}</span></div>
                                    <div className="pl-4"><span className="text-neon-purple">const</span> map = <span className="text-blue-400">new Map</span><span className="text-text-muted">();</span></div>
                                    <div className="pl-4"><span className="text-neon-purple">for</span> <span className="text-text-muted">(let i = 0; i {"<"} nums.length; i++) {"{"}</span></div>
                                    <div className="pl-8"><span className="text-neon-purple">const</span> diff = target - nums[i];</div>
                                    <div className="pl-8"><span className="text-neon-purple">if</span> (map.has(diff)) <span className="text-neon-purple">return</span> [map.get(diff), i];</div>
                                    <div className="pl-8">map.set(nums[i], i);</div>
                                    <div className="pl-4 text-text-muted">{"}"}</div>
                                    <div className="text-text-muted">{"}"}</div>
                                </div>

                                {/* AI Feedback bar */}
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0">
                                        <Brain className="w-3.5 h-3.5 text-background" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-neon-cyan mb-0.5">AI Feedback</p>
                                        <p className="text-xs text-text-secondary">✅ Optimal O(n) solution. Space: O(n). Edge cases handled correctly.</p>
                                    </div>
                                    <div className="ml-auto flex-shrink-0">
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-neon-green">95/100</div>
                                            <div className="text-xs text-text-muted">Score</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating stat badges */}
                        <div className="absolute -left-4 top-8 glass rounded-xl border border-neon-cyan/20 p-3 shadow-neon-cyan hidden lg:block animate-float" style={{ animationDelay: "1s" }}>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                                    <Trophy className="w-3.5 h-3.5 text-neon-cyan" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-text-primary">Top 5%</div>
                                    <div className="text-xs text-text-muted">Leaderboard</div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -right-4 top-12 glass rounded-xl border border-neon-purple/20 p-3 shadow-neon-purple hidden lg:block animate-float" style={{ animationDelay: "2s" }}>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                                    <Zap className="w-3.5 h-3.5 text-neon-purple" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-text-primary">+350 XP</div>
                                    <div className="text-xs text-text-muted">Round Complete</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-12 px-4 border-y border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl font-bold font-display gradient-text-cyan mb-1">{stat.value}</div>
                                <div className="text-sm text-text-muted">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge variant="purple" className="mb-4 mx-auto">Features</Badge>
                        <h2 className="text-4xl font-bold font-display mb-4">
                            Everything you need to <span className="gradient-text-cyan">ace interviews</span>
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            A complete platform for both sides of the hiring process. Powered by AI at every step.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="glass rounded-2xl border border-white/8 p-6 hover:border-white/15 transition-all duration-300 group hover:-translate-y-1"
                                >
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-5 h-5 text-neon-${feature.color}`} />
                                    </div>
                                    <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-surface/40">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <Badge variant="green" className="mb-4 mx-auto">How it works</Badge>
                        <h2 className="text-4xl font-bold font-display">
                            From signup to <span className="gradient-text-green">success</span>
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {howItWorks.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.step} className="relative text-center">
                                    {i < howItWorks.length - 1 && (
                                        <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-neon-cyan/30 to-transparent" />
                                    )}
                                    <div className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center mx-auto mb-4 relative">
                                        <Icon className="w-6 h-6 text-neon-cyan" />
                                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                                            <span className="text-xs font-bold text-background">{i + 1}</span>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-text-primary mb-1">{step.title}</h3>
                                    <p className="text-xs text-text-muted">{step.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-4xl font-bold font-display">
                            Loved by <span className="gradient-text-cyan">thousands</span>
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {testimonials.map((t) => (
                            <div key={t.name} className="glass rounded-2xl border border-white/8 p-6">
                                <div className="flex mb-3">
                                    {Array.from({ length: t.rating }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-text-secondary mb-4 leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-white/10 flex items-center justify-center">
                                        <span className="text-xs font-bold">{t.avatar}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                                        <div className="text-xs text-text-muted">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="glass rounded-3xl border border-neon-cyan/20 p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5" />
                        <div className="relative">
                            <h2 className="text-4xl font-bold font-display mb-4">
                                Ready to ace your{" "}
                                <span className="gradient-text-cyan">next interview?</span>
                            </h2>
                            <p className="text-text-secondary mb-8">
                                Join 50,000+ students and recruiters using AiMock every day.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/auth/signup?role=student">
                                    <Button variant="primary" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                                        Start for Free
                                    </Button>
                                </Link>
                                <Link href="/auth/signup?role=recruiter">
                                    <Button variant="outline" size="xl">
                                        I'm a Recruiter
                                    </Button>
                                </Link>
                            </div>
                            <p className="text-xs text-text-muted mt-4">No credit card required • Free forever plan available</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                            <Brain className="w-3.5 h-3.5 text-background" />
                        </div>
                        <span className="font-bold font-display gradient-text-cyan">AiMock</span>
                    </div>
                    <p className="text-sm text-text-muted">© 2026 AiMock. The future of AI interviews.</p>
                    <div className="flex gap-5 text-sm text-text-muted">
                        <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
                        <a href="#" className="hover:text-text-secondary transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
