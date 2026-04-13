"use client";

import { useState, useEffect } from "react";
import { User, Mail, MapPin, Briefcase, Github, Linkedin, Globe, Save, Upload, PenLine } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";

const techStacks = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", 
    "Python", "Django", "Java", "Spring Boot", "C++", 
    "AWS", "Docker", "MongoDB", "PostgreSQL", "System Design"
];

export default function StudentProfilePage() {
    const [userName, setUserName] = useState("Student");
    const [editName, setEditName] = useState("");
    const [email, setEmail] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [selectedStack, setSelectedStack] = useState<string[]>(["JavaScript", "React", "Node.js", "MongoDB"]);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (!res.ok) {
                    router.push("/auth/login");
                    return;
                }
                const data = await res.json();
                if (data.user) {
                    setUserName(data.user.name);
                    setEditName(data.user.name);
                    setEmail(data.user.email);
                    localStorage.setItem("userName", data.user.name);
                }
            } catch (error) {
                console.error("Failed to fetch user", error);
                router.push("/auth/login");
            } finally {
                setIsPageLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const toggleStack = (stack: string) => {
        if (!isEditing) return;
        setSelectedStack(prev => 
            prev.includes(stack) ? prev.filter(s => s !== stack) : [...prev, stack]
        );
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsEditing(false);
            if (editName.trim()) {
                localStorage.setItem("userName", editName);
                setUserName(editName);
                window.dispatchEvent(new Event("profileUpdated"));
            }
            toast.success("Profile updated successfully!");
        }, 1000);
    };

    if (isPageLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-text-muted">Loading...</div></div>;
    }

    return (
        <div className="min-h-screen">
            <Navbar role="student" userName={userName} />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-text-primary">Your Profile</h1>
                        <p className="text-text-secondary mt-1">Manage your public profile and portfolio</p>
                    </div>
                    <Button 
                        variant={isEditing ? "secondary" : "primary"} 
                        onClick={() => setIsEditing(!isEditing)}
                        leftIcon={!isEditing ? <PenLine className="w-4 h-4" /> : undefined}
                    >
                        {isEditing ? "Cancel" : "Edit Profile"}
                    </Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Avatar & Core Info */}
                    <div className="space-y-6">
                        <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center shadow-neon-purple">
                                    <span className="text-4xl font-bold text-background font-display">{userName.charAt(0).toUpperCase()}</span>
                                </div>
                                {isEditing && (
                                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface border border-white/20 rounded-lg flex items-center justify-center text-text-muted hover:text-neon-cyan hover:border-neon-cyan transition-colors">
                                        <Upload className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">{userName}</h2>
                            <p className="text-neon-cyan text-sm font-medium mt-1">Full Stack Developer</p>
                            
                            <div className="w-full mt-6 space-y-3 pt-6 border-t border-white/10">
                                <div className="flex items-center text-sm text-text-secondary">
                                    <Mail className="w-4 h-4 mr-3 text-text-muted" /> {email}
                                </div>
                                <div className="flex items-center text-sm text-text-secondary">
                                    <MapPin className="w-4 h-4 mr-3 text-text-muted" /> San Francisco, CA
                                </div>
                                <div className="flex items-center text-sm text-text-secondary">
                                    <Briefcase className="w-4 h-4 mr-3 text-text-muted" /> Seeking Opportunities
                                </div>
                            </div>
                        </div>

                        {/* Resume Section */}
                        <div className="glass rounded-2xl border border-white/10 p-6">
                            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Resume
                            </h3>
                            <div className="border border-dashed border-white/20 rounded-xl p-5 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                <Upload className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
                                <p className="text-sm font-medium text-text-primary">Resume.pdf</p>
                                <p className="text-xs text-text-muted mt-1">Updated 2 days ago</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSave} className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
                            <h3 className="font-semibold text-lg text-text-primary mb-6">Personal details</h3>
                            
                            <div className="grid sm:grid-cols-2 gap-5 mb-6">
                                <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={!isEditing} />
                                <Input label="Professional Headline" defaultValue="Full Stack Developer" disabled={!isEditing} />
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Bio</label>
                                    <textarea 
                                        className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50 min-h-[100px] resize-y"
                                        defaultValue="Passionate software engineer focused on building scalable web applications. Strong foundation in DSA and system design."
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg text-text-primary mb-4 mt-8">Tech Stack</h3>
                            <div className="flex flex-wrap gap-2 mb-8">
                                {techStacks.map(stack => {
                                    const selected = selectedStack.includes(stack);
                                    return (
                                        <button 
                                            key={stack}
                                            type="button"
                                            onClick={() => toggleStack(stack)}
                                            disabled={!isEditing}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                                selected 
                                                    ? "bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan" 
                                                    : "glass border-white/10 text-text-muted"
                                            } ${isEditing ? "hover:scale-105 cursor-pointer" : "cursor-default opacity-80"}`}
                                        >
                                            {stack}
                                        </button>
                                    );
                                })}
                            </div>

                            <h3 className="font-semibold text-lg text-text-primary mb-4">Social Links</h3>
                            <div className="grid sm:grid-cols-2 gap-5 mb-8">
                                <Input label="GitHub URL" defaultValue="github.com/developer" leftIcon={<Github className="w-4 h-4" />} disabled={!isEditing} />
                                <Input label="LinkedIn URL" defaultValue="linkedin.com/in/developer" leftIcon={<Linkedin className="w-4 h-4" />} disabled={!isEditing} />
                            </div>

                            {isEditing && (
                                <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
                                        Save Profile
                                    </Button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
