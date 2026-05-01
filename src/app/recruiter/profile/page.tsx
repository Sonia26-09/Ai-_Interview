"use client";

import { useState, useEffect } from "react";
import {
    User, Mail, Globe, Building2, Briefcase, MapPin,
    Save, Upload, PenLine, Shield, Calendar, Brain,
    Award, Loader2, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    company?: string;
    techStack: string[];
    totalInterviews: number;
    activeRoles: number;
    preferences: any;
    createdAt: string;
}

export default function RecruiterProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Editable fields
    const [editName, setEditName] = useState("");
    const [editCompany, setEditCompany] = useState("");

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.user);
                    setEditName(data.user.name || "");
                    setEditCompany(data.user.company || "");
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    company: editCompany.trim(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Failed to update profile");
                setIsSaving(false);
                return;
            }

            const data = await res.json();
            setProfile((prev) => prev ? { ...prev, name: data.user.name, company: data.user.company } : prev);
            setIsEditing(false);

            // Update localStorage and dispatch event for Navbar
            localStorage.setItem("userName", data.user.name);
            window.dispatchEvent(new Event("profileUpdated"));

            toast.success("Profile updated successfully!");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setEditName(profile.name);
            setEditCompany(profile.company || "");
        }
        setIsEditing(false);
    };

    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "";

    // ── Loading ───────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar role="recruiter" userName="..." />
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-48 bg-white/5 rounded-lg" />
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="glass rounded-2xl border border-white/8 p-6 h-72" />
                            <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-8 h-96" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen">
                <Navbar role="recruiter" userName="Recruiter" />
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-30" />
                    <h1 className="text-2xl font-bold font-display mb-2">Profile Not Found</h1>
                    <p className="text-text-muted mb-6">Unable to load your profile. Please try logging in again.</p>
                    <Link href="/auth/login">
                        <Button variant="primary">Go to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={profile.name} />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-text-primary">My Profile</h1>
                        <p className="text-text-secondary mt-1">Manage your personal & company details</p>
                    </div>
                    <Button
                        variant={isEditing ? "secondary" : "primary"}
                        onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                        leftIcon={!isEditing ? <PenLine className="w-4 h-4" /> : undefined}
                    >
                        {isEditing ? "Cancel" : "Edit Profile"}
                    </Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* ── Left Column: Profile Card ────────────────────── */}
                    <div className="space-y-6">
                        <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col items-center text-center">
                            {/* Avatar */}
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center shadow-neon-cyan">
                                    <span className="text-3xl font-bold text-background">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-text-primary">{profile.name}</h2>
                            {profile.company && (
                                <p className="text-neon-cyan text-sm font-medium mt-1">{profile.company}</p>
                            )}
                            <Badge variant="cyan" className="mt-2">Recruiter</Badge>

                            {/* Contact Info */}
                            <div className="w-full mt-6 space-y-3 pt-6 border-t border-white/10 text-left">
                                <div className="flex items-center text-sm text-text-secondary">
                                    <Mail className="w-4 h-4 mr-3 text-text-muted flex-shrink-0" />
                                    <span className="truncate">{profile.email}</span>
                                </div>
                                {profile.company && (
                                    <div className="flex items-center text-sm text-text-secondary">
                                        <Building2 className="w-4 h-4 mr-3 text-text-muted flex-shrink-0" />
                                        {profile.company}
                                    </div>
                                )}
                                <div className="flex items-center text-sm text-text-secondary">
                                    <Calendar className="w-4 h-4 mr-3 text-text-muted flex-shrink-0" />
                                    Member since {memberSince}
                                </div>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="glass rounded-2xl border border-white/10 p-5">
                            <h3 className="font-semibold text-text-primary text-sm mb-4">Activity</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-text-muted">
                                        <Brain className="w-4 h-4 text-neon-purple" />Interviews Created
                                    </span>
                                    <span className="font-bold text-text-primary">{profile.totalInterviews}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-text-muted">
                                        <Briefcase className="w-4 h-4 text-neon-green" />Active Roles
                                    </span>
                                    <span className="font-bold text-text-primary">{profile.activeRoles}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-text-muted">
                                        <Shield className="w-4 h-4 text-neon-cyan" />Account Verified
                                    </span>
                                    <Badge variant="green" size="sm">Yes</Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column: Edit Form ──────────────────────── */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSave} className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
                            <h3 className="font-semibold text-lg text-text-primary mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-neon-cyan" /> Personal Details
                            </h3>

                            <div className="grid sm:grid-cols-2 gap-5 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 disabled:opacity-50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary pl-10 pr-4 py-2.5 opacity-50 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg text-text-primary mb-4 mt-2 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-neon-cyan" /> Company Information
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-5 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Company Name</label>
                                    <input
                                        type="text"
                                        value={editCompany}
                                        onChange={(e) => setEditCompany(e.target.value)}
                                        placeholder="Enter company name"
                                        disabled={!isEditing}
                                        className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary px-4 py-2.5 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 disabled:opacity-50 placeholder:text-text-muted transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
                                    <input
                                        type="text"
                                        value="Recruiter"
                                        disabled
                                        className="w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary px-4 py-2.5 opacity-50 cursor-not-allowed capitalize"
                                    />
                                </div>
                            </div>

                            {/* Account Security */}
                            <h3 className="font-semibold text-lg text-text-primary mb-4 mt-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-neon-cyan" /> Account Security
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-5 mb-8">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
                                    <div>
                                        <div className="text-sm font-medium text-text-primary">Two-Factor Auth</div>
                                        <div className="text-xs text-text-muted mt-0.5">Extra security layer</div>
                                    </div>
                                    <Badge variant={profile.preferences?.security?.twoFactorEnabled ? "green" : "default"} size="sm">
                                        {profile.preferences?.security?.twoFactorEnabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
                                    <div>
                                        <div className="text-sm font-medium text-text-primary">Email Notifications</div>
                                        <div className="text-xs text-text-muted mt-0.5">Receive updates via email</div>
                                    </div>
                                    <Badge variant={profile.preferences?.notifications?.email ? "green" : "default"} size="sm">
                                        {profile.preferences?.notifications?.email ? "On" : "Off"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Save Button */}
                            {isEditing && (
                                <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        isLoading={isSaving}
                                        leftIcon={!isSaving ? <Save className="w-4 h-4" /> : undefined}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </form>

                        {/* Quick Links */}
                        <div className="mt-6 glass rounded-2xl border border-white/10 p-5">
                            <h3 className="font-semibold text-text-primary text-sm mb-4">Quick Links</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/recruiter/dashboard" className="flex items-center gap-2 text-sm text-text-muted hover:text-neon-cyan p-3 rounded-xl bg-white/3 border border-white/8 hover:border-neon-cyan/30 transition-all">
                                    <Award className="w-4 h-4" /> Dashboard
                                </Link>
                                <Link href="/recruiter/interviews" className="flex items-center gap-2 text-sm text-text-muted hover:text-neon-cyan p-3 rounded-xl bg-white/3 border border-white/8 hover:border-neon-cyan/30 transition-all">
                                    <Brain className="w-4 h-4" /> Interviews
                                </Link>
                                <Link href="/recruiter/interviews/create" className="flex items-center gap-2 text-sm text-text-muted hover:text-neon-cyan p-3 rounded-xl bg-white/3 border border-white/8 hover:border-neon-cyan/30 transition-all">
                                    <Briefcase className="w-4 h-4" /> Create Interview
                                </Link>
                                <Link href="/settings" className="flex items-center gap-2 text-sm text-text-muted hover:text-neon-cyan p-3 rounded-xl bg-white/3 border border-white/8 hover:border-neon-cyan/30 transition-all">
                                    <Shield className="w-4 h-4" /> Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
