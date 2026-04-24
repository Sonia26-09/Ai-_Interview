"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Building2, GraduationCap } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// Strict email regex — domain must start with a letter, extension must be 2+ letters
// Blocks: ridhi@23gmail.com, abc@123.com, test@.com, user@gmail.c
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

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
    
    // 2FA state
    const [step, setStep] = useState<"credentials" | "2fa">("credentials");
    const [tempUserId, setTempUserId] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");

    const router = useRouter();

    // Real-time email validation on input change
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setEmail(newValue);
        // Clear error if user fixes their input
        if (emailError) {
            if (EMAIL_REGEX.test(newValue)) {
                setEmailError("");
            } else {
                setEmailError("Please enter a valid email (e.g. name@example.com)");
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError("");
        setPasswordError("");
        
        // Frontend validation — matches backend regex
        let isValid = true;
        
        if (!EMAIL_REGEX.test(email)) {
            setEmailError("Please enter a valid email (e.g. name@example.com)");
            isValid = false;
        }
        
        if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            isValid = false;
        }

        if (!isValid) return;

        setIsLoading(true);
        
        try {
            // Normalize email before sending — lowercase + trim
            const normalizedEmail = email.toLowerCase().trim();

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail, password, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Show specific error messages based on backend response
                const err = data.error || "Login failed";
                
                if (err === "No account found with this email") {
                    // Email not registered
                    setEmailError(err);
                } else if (err === "Incorrect password") {
                    // Wrong password
                    setPasswordError(err);
                } else if (err.toLowerCase().includes("email")) {
                    // Invalid email format
                    setEmailError(err);
                } else {
                    // Generic / rate limit / other errors
                    toast.error(err);
                }
                return;
            }

            if (data.require2Fa) {
                setTempUserId(data.userId);
                setStep("2fa");
                toast.success(data.message || "OTP sent to your email!");
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

    const handleVerify2Fa = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpError("");
        
        if (otp.length < 6) {
            setOtpError("Please enter the 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/2fa/verify-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: tempUserId, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                setOtpError(data.error || "Invalid OTP");
                toast.error(data.error || "Verification failed");
                return;
            }

            toast.success("Login successful!");
            localStorage.setItem("userName", data.user.name);
            window.location.href = role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
        } catch (error) {
            console.error("2FA error:", error);
            toast.error("Something went wrong verifying your code.");
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

                {step === "credentials" ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleEmailChange}
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
                            <Link href="/auth/forgot-password" className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors">Forgot password?</Link>
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
                ) : (
                    <form onSubmit={handleVerify2Fa} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-4 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 mb-6 text-center">
                            <Lock className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
                            <h3 className="text-sm font-medium text-text-primary">Two-Factor Authentication</h3>
                            <p className="text-xs text-text-muted mt-1">We've sent a 6-digit code to <strong>{email}</strong></p>
                        </div>
                        <Input
                            label="Security Code"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(""); }}
                            error={otpError}
                            required
                            className="text-center font-mono text-lg tracking-[0.5em]"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isLoading}
                            rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
                        >
                            Verify & Log In
                        </Button>
                        <div className="text-center mt-4">
                            <button 
                                type="button" 
                                onClick={() => setStep("credentials")} 
                                className="text-xs text-text-muted hover:text-text-primary transition-colors"
                            >
                                Back to login
                            </button>
                        </div>
                    </form>
                )}

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
