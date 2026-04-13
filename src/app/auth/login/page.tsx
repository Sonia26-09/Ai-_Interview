"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Building2, GraduationCap } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function LoginPageContent() {
    const searchParams = useSearchParams();
    const [role, setRole] = useState<"student" | "recruiter">(
        (searchParams.get("role") as "student" | "recruiter") || "student"
    );
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError("");
        setPasswordError("");
        
        // Validation
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            setEmailError("Please enter a proper valid email address.");
            isValid = false;
        }
        
        if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            isValid = false;
        }

        if (!isValid) return;

        setIsLoading(true);
        
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                // If it's auth failure, show the error below the password field
                if (data.error === "Invalid credentials") {
                    setEmailError("Invalid credentials");
                    setPasswordError("Invalid email or password");
                } else {
                    toast.error(data.error || "Login failed");
                }
                return;
            }

            toast.success("Login successful!");
            localStorage.setItem("userName", data.user.name);
            window.location.href = role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto">
                <Link href="/" className="flex items-center gap-2 mb-10 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan group-hover:scale-110 transition-transform">
                        <Brain className="w-4 h-4 text-background" />
                    </div>
                    <span className="text-lg font-bold font-display gradient-text-cyan">AiMock</span>
                </Link>

                <h1 className="text-3xl font-bold font-display text-text-primary mb-2">Welcome back</h1>
                <p className="text-text-secondary mb-8">Sign in to continue your journey</p>

                {/* Role Toggle */}
                <div className="flex gap-2 mb-8 p-1 glass rounded-xl border border-white/10">
                    <button
                        onClick={() => setRole("student")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${role === "student"
                                ? "bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-neon-cyan border border-neon-cyan/30"
                                : "text-text-muted hover:text-text-secondary"
                            }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Student
                    </button>
                    <button
                        onClick={() => setRole("recruiter")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${role === "recruiter"
                                ? "bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 text-neon-purple border border-neon-purple/30"
                                : "text-text-muted hover:text-text-secondary"
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Recruiter
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                        leftIcon={<Mail className="w-4 h-4" />}
                        error={emailError}
                        required
                    />
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                        leftIcon={<Lock className="w-4 h-4" />}
                        error={passwordError}
                        rightIcon={
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:text-text-secondary transition-colors">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        }
                        required
                    />
                    <div className="flex justify-end">
                        <a href="#" className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors">Forgot password?</a>
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isLoading}
                        rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
                    >
                        Sign In as {role === "student" ? "Student" : "Recruiter"}
                    </Button>
                </form>

                {/* Demo quick login */}
                <div className="mt-4 p-4 glass rounded-xl border border-white/8">
                    <p className="text-xs text-text-muted text-center mb-3">🚀 Quick Demo Access</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { window.location.href = "/student/dashboard"; }}
                            className="flex-1 text-xs py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20 transition-all"
                        >
                            Student Demo
                        </button>
                        <button
                            onClick={() => { window.location.href = "/recruiter/dashboard"; }}
                            className="flex-1 text-xs py-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 transition-all"
                        >
                            Recruiter Demo
                        </button>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-text-muted">
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="text-neon-cyan hover:text-neon-cyan/80 font-medium transition-colors">
                        Sign up free
                    </Link>
                </p>
            </div>

            {/* Right - Visual */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-surface-2/50 border-l border-white/5 p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
                <div className="relative text-center max-w-sm">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center mx-auto mb-6 shadow-neon-cyan animate-float">
                        <Brain className="w-10 h-10 text-background" />
                    </div>
                    <h2 className="text-2xl font-bold font-display gradient-text-cyan mb-3">AI-Powered Interviews</h2>
                    <p className="text-text-secondary text-sm">
                        Recruiter-grade platform meets student-ready practice mode. Real-time AI feedback, code execution, and deep analytics.
                    </p>
                    <div className="mt-8 grid grid-cols-2 gap-3">
                        {[
                            { label: "Avg. Score Boost", value: "+32%" },
                            { label: "Success Rate", value: "87%" },
                            { label: "Questions", value: "1M+" },
                            { label: "Active Users", value: "50K+" },
                        ].map((s) => (
                            <div key={s.label} className="glass rounded-xl border border-white/8 p-3 text-center">
                                <div className="text-xl font-bold gradient-text-cyan">{s.value}</div>
                                <div className="text-xs text-text-muted">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-text-muted">Loading...</div></div>}>
            <LoginPageContent />
        </Suspense>
    );
}
