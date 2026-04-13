"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Brain, Mail, Lock, User, Building2, GraduationCap, ArrowRight, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { TechStack } from "@/lib/types";

const allTechStacks: TechStack[] = [
    "JavaScript", "TypeScript", "Python", "Java", "C++",
    "React", "Node.js", "Next.js", "Django", "Spring Boot",
    "MongoDB", "PostgreSQL", "DSA", "System Design", "AI/ML", "DevOps", "AWS", "Docker",
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function SignupContent() {
    const searchParams = useSearchParams();
    const [role, setRole] = useState<"student" | "recruiter">(
        (searchParams.get("role") as "student" | "recruiter") || "student"
    );
    const [step, setStep] = useState(1);
    const [selectedStack, setSelectedStack] = useState<TechStack[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const toggleStack = (stack: TechStack) => {
        setSelectedStack((prev) =>
            prev.includes(stack) ? prev.filter((s) => s !== stack) : [...prev, stack]
        );
    };

    const router = useRouter();

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setForm({ ...form, email: newValue });
        
        if (emailError) {
            if (EMAIL_REGEX.test(newValue)) {
                setEmailError("");
            } else {
                setEmailError("Please enter a valid email address.");
            }
        }
    };

    const completeSignup = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role,
                    company: form.company,
                    techStack: selectedStack,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error?.toLowerCase().includes("user already exists") || data.error?.toLowerCase().includes("email")) {
                    setStep(1);
                    setEmailError("Email is already registered");
                } else {
                    toast.error(data.error || "Signup failed");
                }
                setIsLoading(false);
                return;
            }

            toast.success("Account created successfully!");
            localStorage.setItem("userName", data.user.name);
            window.location.href = role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
        } catch (error) {
            console.error("Signup error:", error);
            toast.error("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError("");
        setPasswordError("");

        let isValid = true;
        
        if (!EMAIL_REGEX.test(form.email)) {
            setEmailError("Please enter a valid email address.");
            isValid = false;
        }

        if (form.password.length < 8) {
            setPasswordError("Password must be at least 8 characters.");
            isValid = false;
        }

        if (!isValid) return;

        if (step === 1 && role === "student") { 
            setStep(2); 
            return; 
        }
        await completeSignup();
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Link href="/" className="flex items-center gap-2 mb-8 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan group-hover:scale-110 transition-transform">
                        <Brain className="w-4 h-4 text-background" />
                    </div>
                    <span className="text-lg font-bold font-display gradient-text-cyan">AiMock</span>
                </Link>

                <div className="glass rounded-2xl border border-white/10 p-8 shadow-glass">
                    <h1 className="text-2xl font-bold font-display mb-1">Create your account</h1>
                    <p className="text-text-secondary text-sm mb-6">
                        {step === 1 ? "Choose your role and fill in your details" : "Select your tech stack to personalize your experience"}
                    </p>

                    {/* Progress dots */}
                    {role === "student" && (
                        <div className="flex items-center gap-2 mb-6">
                            {[1, 2].map((s) => (
                                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-gradient-to-r from-neon-cyan to-neon-purple" : "bg-white/10"}`} />
                            ))}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Role Toggle */}
                            <div className="flex gap-2 p-1 glass rounded-xl border border-white/10">
                                <button type="button" onClick={() => setRole("student")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === "student" ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30" : "text-text-muted hover:text-text-secondary"}`}>
                                    <GraduationCap className="w-4 h-4" />Student
                                </button>
                                <button type="button" onClick={() => setRole("recruiter")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === "recruiter" ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/30" : "text-text-muted hover:text-text-secondary"}`}>
                                    <Building2 className="w-4 h-4" />Recruiter
                                </button>
                            </div>

                            <Input label="Full Name" placeholder="Your full name" leftIcon={<User className="w-4 h-4" />}
                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            <Input label="Email" type="email" placeholder="you@example.com" leftIcon={<Mail className="w-4 h-4" />}
                                value={form.email} onChange={handleEmailChange} error={emailError} required />
                            {role === "recruiter" && (
                                <Input label="Company Name" placeholder="Your company" leftIcon={<Building2 className="w-4 h-4" />}
                                    value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
                            )}
                            <Input label="Password" type="password" placeholder="••••••••" leftIcon={<Lock className="w-4 h-4" />}
                                value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setPasswordError(""); }} error={passwordError} required
                                helperText="Minimum 8 characters" />

                            <Button type="submit" variant="primary" size="lg" className="w-full mt-2"
                                rightIcon={role === "student" ? <ArrowRight className="w-4 h-4" /> : undefined}
                                isLoading={isLoading}>
                                {role === "student" ? "Continue" : "Create Account"}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-text-secondary">Select all that apply — we'll personalize your experience</p>
                            <div className="flex flex-wrap gap-2">
                                {allTechStacks.map((stack) => {
                                    const selected = selectedStack.includes(stack);
                                    return (
                                        <button key={stack} onClick={() => toggleStack(stack)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${selected ? "bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan" : "glass border-white/10 text-text-muted hover:border-white/20 hover:text-text-secondary"
                                                }`}>
                                            {selected && <Check className="w-3 h-3" />}
                                            {stack}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-3 mt-2">
                                <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                                <Button variant="primary" size="lg" className="flex-1" isLoading={isLoading}
                                    onClick={completeSignup}>
                                    Get Started 🚀
                                </Button>
                            </div>
                            <p className="text-xs text-text-muted text-center">You can always update this later in your profile</p>
                        </div>
                    )}

                    <p className="mt-5 text-center text-xs text-text-muted">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-neon-cyan hover:text-neon-cyan/80 font-medium transition-colors">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-text-muted">Loading...</div></div>}>
            <SignupContent />
        </Suspense>
    );
}
