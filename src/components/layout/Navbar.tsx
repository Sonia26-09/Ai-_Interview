"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Brain,
    Bell,
    ChevronDown,
    Menu,
    X,
    Zap,
    User,
    LogOut,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface NavbarProps {
    role?: "recruiter" | "student" | null;
    userName?: string;
    unreadCount?: number;
}

const recruiterLinks = [
    { href: "/recruiter/dashboard", label: "Dashboard" },
    { href: "/recruiter/interviews", label: "Interviews" },
    { href: "/recruiter/analytics", label: "Analytics" },
];

const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/practice", label: "Practice" },
    { href: "/student/leaderboard", label: "Leaderboard" },
    { href: "/student/progress", label: "Progress" },
];

export default function Navbar({ role, userName = "User", unreadCount = 0 }: NavbarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [displayName, setDisplayName] = useState(userName);

    useEffect(() => {
        const loadName = () => {
            const storedName = localStorage.getItem("userName");
            if (storedName) {
                setDisplayName(storedName);
            }
        };
        loadName();
        
        window.addEventListener("profileUpdated", loadName);
        return () => window.removeEventListener("profileUpdated", loadName);
    }, []);

    const navLinks = role === "recruiter" ? recruiterLinks : role === "student" ? studentLinks : [];

    return (
        <nav className="sticky top-0 z-50 glass-dark border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan group-hover:scale-110 transition-transform">
                            <Brain className="w-4 h-4 text-background" />
                        </div>
                        <span className="text-lg font-bold font-display gradient-text-cyan">AiMock</span>
                    </Link>

                    {/* Desktop Nav Links */}
                    {navLinks.length > 0 && (
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        pathname === link.href
                                            ? "text-neon-cyan bg-neon-cyan/10"
                                            : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {!role && (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link href="/auth/login">
                                    <Button variant="ghost" size="md">Sign In</Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button variant="primary" size="md">Get Started</Button>
                                </Link>
                            </div>
                        )}

                        {role && (
                            <>
                                {/* Notifications */}
                                <button className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
                                    <Bell className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-neon-cyan text-[8px] font-bold text-background rounded-full border-2 border-background flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* XP Badge for students */}
                                {role === "student" && (
                                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
                                        <Zap className="w-3.5 h-3.5 text-neon-purple" />
                                        <span className="text-xs font-semibold text-neon-purple">8,450 XP</span>
                                    </div>
                                )}

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-white/10 flex items-center justify-center">
                                            <span className="text-xs font-bold text-text-primary">
                                                {displayName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="hidden sm:block text-sm font-medium text-text-primary">{displayName}</span>
                                        <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform", profileOpen && "rotate-180")} />
                                    </button>

                                    {profileOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 z-[100] glass rounded-xl border border-white/10 shadow-glass overflow-hidden bg-black/90 backdrop-blur-xl">
                                            <div className="p-1">
                                                <Link
                                                    href={`/${role}/profile`}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all"
                                                    onClick={() => setProfileOpen(false)}
                                                >
                                                    <User className="w-4 h-4" />
                                                    Profile
                                                </Link>
                                                <Link
                                                    href="/settings"
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all"
                                                    onClick={() => setProfileOpen(false)}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Settings
                                                </Link>
                                                <hr className="border-white/10 my-1" />
                                                <Link
                                                    href="/auth/login"
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                                                    onClick={() => {
                                                        setProfileOpen(false);
                                                        localStorage.removeItem("userName");
                                                    }}
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            className="md:hidden p-2 text-text-muted hover:text-text-primary"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden glass-dark border-t border-white/5 px-4 py-3 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "block px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname === link.href
                                    ? "text-neon-cyan bg-neon-cyan/10"
                                    : "text-text-secondary hover:text-text-primary"
                            )}
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!role && (
                        <>
                            <Link href="/auth/login" className="block" onClick={() => setMobileOpen(false)}>
                                <Button variant="ghost" size="md" className="w-full justify-start">Sign In</Button>
                            </Link>
                            <Link href="/auth/signup" className="block" onClick={() => setMobileOpen(false)}>
                                <Button variant="primary" size="md" className="w-full">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
