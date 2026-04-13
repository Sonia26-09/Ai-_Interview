"use client";

import { useState, useEffect } from "react";
import { User, Mail, Globe, Building2, Briefcase, MapPin, Save, Upload, PenLine } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function RecruiterProfilePage() {
    const [userName, setUserName] = useState("Recruiter");
    const [editName, setEditName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("userName");
        if (storedName) {
            setUserName(storedName);
            setEditName(storedName);
        }
    }, []);

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

    return (
        <div className="min-h-screen">
            <Navbar role="recruiter" userName={userName} />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-text-primary">Company Profile</h1>
                        <p className="text-text-secondary mt-1">Manage your organization's recruiting presence</p>
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
                    {/* Left Column - Branding & Core Info */}
                    <div className="space-y-6">
                        <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center shadow-neon-cyan">
                                    <Building2 className="w-10 h-10 text-background" />
                                </div>
                                {isEditing && (
                                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface border border-white/20 rounded-lg flex items-center justify-center text-text-muted hover:text-neon-cyan hover:border-neon-cyan transition-colors">
                                        <Upload className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">TechNova Inc.</h2>
                            <p className="text-neon-cyan text-sm font-medium mt-1">Software Enterprise</p>
                            
                            <div className="w-full mt-6 space-y-3 pt-6 border-t border-white/10 text-left">
                                <div className="flex items-center text-sm text-text-secondary">
                                    <User className="w-4 h-4 mr-3 text-text-muted" /> HR: {userName}
                                </div>
                                <div className="flex items-center text-sm text-text-secondary">
                                    <Mail className="w-4 h-4 mr-3 text-text-muted" /> contact@technova.com
                                </div>
                                <div className="flex items-center text-sm text-text-secondary">
                                    <MapPin className="w-4 h-4 mr-3 text-text-muted" /> Tech District, NY
                                </div>
                                <div className="flex items-center text-sm text-text-secondary">
                                    <Briefcase className="w-4 h-4 mr-3 text-text-muted" /> 5 Active Listings
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSave} className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
                            <h3 className="font-semibold text-lg text-text-primary mb-6 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-neon-cyan" /> Organization Details
                            </h3>
                            
                            <div className="grid sm:grid-cols-2 gap-5 mb-6">
                                <Input label="Company Name" defaultValue="TechNova Inc." disabled={!isEditing} />
                                <Input label="Industry" defaultValue="Software Enterprise" disabled={!isEditing} />
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Company Description</label>
                                    <textarea 
                                        className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50 min-h-[100px] resize-y"
                                        defaultValue="We build cutting edge AI solutions for modern businesses. Always looking for top tier talent."
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg text-text-primary mb-4 mt-8 flex items-center gap-2">
                                <User className="w-5 h-5 text-neon-cyan" /> Representative Details
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-5 mb-8">
                                <Input label="Your Name" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={!isEditing} />
                                <Input label="Your Role" defaultValue="Senior Talent Sourcer" disabled={!isEditing} />
                                <Input label="Contact Email" type="email" defaultValue={`${userName.split(" ")[0].toLowerCase()}@technova.com`} leftIcon={<Mail className="w-4 h-4" />} disabled={!isEditing} />
                                <Input label="Website" defaultValue="https://technova.com" leftIcon={<Globe className="w-4 h-4" />} disabled={!isEditing} />
                            </div>

                            {isEditing && (
                                <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
                                        Save Changes
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
