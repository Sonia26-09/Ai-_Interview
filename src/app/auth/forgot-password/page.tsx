"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Brain, Mail, Lock, ArrowRight, ArrowLeft, ShieldCheck, Check, KeyRound } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [otpToken, setOtpToken] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [emailError, setEmailError] = useState("");

    // Step 1: Send OTP
    const handleSendOTP = async () => {
        setEmailError("");
        if (!email.trim()) {
            setEmailError("Please enter your email");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase().trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                setEmailError(data.error || "Failed to send OTP");
                return;
            }

            if (data.otpToken) {
                setOtpToken(data.otpToken);
            }
            setStep(2);
            toast.success("If this email is registered, an OTP has been sent.");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        setOtpError("");
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setOtpError("Please enter the complete 6-digit OTP");
            return;
        }

        if (!otpToken) {
            setOtpError("No OTP token found. Please request a new OTP.");
            return;
        }

        // OTP is valid — proceed to password reset step
        setStep(3);
    };

    // Step 3: Reset password
    const handleResetPassword = async () => {
        setPasswordError("");

        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    otp: otp.join(""),
                    otpToken,
                    newPassword,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.error?.includes("OTP")) {
                    setStep(2);
                    setOtpError(data.error);
                } else {
                    setPasswordError(data.error || "Reset failed");
                }
                return;
            }

            setStep(4);
            toast.success("Password reset successfully!");
            setTimeout(() => router.push("/auth/login"), 2000);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // OTP input handlers
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError("");
        if (value && index < 5) {
            document.getElementById(`fp-otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`fp-otp-${index - 1}`)?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pastedData.length === 6) {
            setOtp(pastedData.split(""));
            document.getElementById("fp-otp-5")?.focus();
        }
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
                    <h1 className="text-2xl font-bold font-display mb-1">
                        {step <= 2 ? "Reset your password" : step === 3 ? "Set new password" : "Password reset!"}
                    </h1>
                    <p className="text-text-secondary text-sm mb-6">
                        {step === 1 && "Enter your email to receive a verification code"}
                        {step === 2 && `Enter the OTP sent to ${email}`}
                        {step === 3 && "Choose a strong new password"}
                        {step === 4 && "Your password has been updated"}
                    </p>

                    {/* Progress dots */}
                    <div className="flex items-center gap-2 mb-6">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= Math.min(step, 3) ? "bg-gradient-to-r from-neon-cyan to-neon-purple" : "bg-white/10"}`} />
                        ))}
                    </div>

                    {/* Step 1: Email */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSendOTP()}
                                leftIcon={<Mail className="w-4 h-4" />}
                                error={emailError}
                                required
                            />

                            <Button variant="primary" size="lg" className="w-full"
                                isLoading={isLoading} onClick={handleSendOTP}
                                rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}>
                                Send OTP
                            </Button>

                            <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mt-2">
                                <ArrowLeft className="w-3 h-3" /> Back to sign in
                            </Link>
                        </div>
                    )}

                    {/* Step 2: OTP */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl border border-neon-purple/30 bg-neon-purple/5 text-center">
                                <ShieldCheck className="w-6 h-6 text-neon-purple mx-auto mb-2" />
                                <p className="text-xs text-text-muted">
                                    Enter the 6-digit code sent to <strong className="text-neon-cyan">{email}</strong>
                                </p>
                            </div>

                            {otpError && (
                                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
                                    {otpError}
                                </div>
                            )}

                            <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`fp-otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                        className={`w-12 h-14 text-center text-xl font-bold bg-surface-2 rounded-xl border-2 text-text-primary outline-none transition-all duration-200 focus:ring-2 focus:ring-neon-purple/30 ${
                                            digit ? "border-neon-purple/50" : "border-white/10"
                                        }`}
                                    />
                                ))}
                            </div>

                            <Button variant="primary" size="lg" className="w-full"
                                isLoading={isLoading} onClick={handleVerifyOTP}
                                rightIcon={<ArrowRight className="w-4 h-4" />}>
                                Verify OTP
                            </Button>

                            <div className="flex justify-between items-center">
                                <button onClick={() => { setStep(1); setOtp(["","","","","",""]); setOtpError(""); }}
                                    className="text-xs text-text-muted hover:text-text-primary transition-colors">
                                    ← Change email
                                </button>
                                <button onClick={handleSendOTP} disabled={isLoading}
                                    className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors">
                                    Resend OTP
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-neon-green/30 bg-neon-green/5 text-center mb-2">
                                <KeyRound className="w-6 h-6 text-neon-green mx-auto mb-2" />
                                <p className="text-xs text-text-muted">OTP verified! Set your new password below.</p>
                            </div>

                            {passwordError && (
                                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
                                    {passwordError}
                                </div>
                            )}

                            <Input
                                label="New Password"
                                type="password"
                                placeholder="Min 8 characters"
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                                leftIcon={<Lock className="w-4 h-4" />}
                                helperText="Minimum 8 characters"
                            />

                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                                leftIcon={<Lock className="w-4 h-4" />}
                            />

                            <Button variant="primary" size="lg" className="w-full"
                                isLoading={isLoading} onClick={handleResetPassword}
                                rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}>
                                Reset Password
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-neon-green/20 border-2 border-neon-green/40 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-neon-green" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-1">Password Reset!</h3>
                            <p className="text-sm text-text-muted">Redirecting to sign in...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
