"use client";

import { useState, useEffect } from "react";
import { User, Bell, Lock, Shield, Laptop, Moon, Sun, Save, CheckCircle2, Clock, Globe, Type, LayoutDashboard, Key, Eye, UserX, MonitorSmartphone, Share2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";
import { usePreferencesStore } from "@/store/usePreferencesStore";

interface Notification {
    _id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function SettingsPage() {
    const { t } = useTranslation();
    const [role, setRole] = useState<"student" | "recruiter" | null>(null);
    const [userName, setUserName] = useState("User");
    const [editName, setEditName] = useState("");
    const [email, setEmail] = useState("");
    const [isPageLoading, setIsPageLoading] = useState(true);
    
    // Tab and notifications state
    const [activeTab, setActiveTab] = useState<"account" | "notifications" | "privacy" | "preferences">("account");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isFetchingNotifications, setIsFetchingNotifications] = useState(false);

    // Preferences global store
    const preferences = usePreferencesStore(state => state.preferences);
    const updatePreference = usePreferencesStore(state => state.updatePreference);
    const setPreferences = usePreferencesStore(state => state.setPreferences);

    const router = useRouter();

    const fetchNotifications = async () => {
        setIsFetchingNotifications(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsFetchingNotifications(false);
        }
    };

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
                    setRole(data.user.role);
                    localStorage.setItem("userName", data.user.name);
                    
                    if (data.user.preferences) {
                        setPreferences(data.user.preferences);
                    }
                }
                await fetchNotifications();
            } catch (error) {
                console.error("Failed to fetch user", error);
                router.push("/auth/login");
            } finally {
                setIsPageLoading(false);
            }
        };

        fetchUser();
    }, [router, setPreferences]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);

    // 2FA Setup State
    const [is2faModalOpen, setIs2faModalOpen] = useState(false);
    const [twoFaOtp, setTwoFaOtp] = useState("");
    const [is2faVerifying, setIs2faVerifying] = useState(false);
    const [twoFaError, setTwoFaError] = useState("");

   const handleToggle2FA = async () => {
  if (preferences.security.twoFactorEnabled) {
    handlePreferenceChange("security", "twoFactorEnabled", false);
  } else {
    setIs2faModalOpen(true);
    setTwoFaError("");
    setTwoFaOtp("");

    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send OTP");
      }

      toast.success("OTP sent to your email!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate OTP");
      setIs2faModalOpen(false);
    }
  }
};

 const handleVerify2FASetup = async () => {
  if (twoFaOtp.length < 6) {
    return setTwoFaError("Enter 6 digit OTP");
  }

  setIs2faVerifying(true);
  try {
    const res = await fetch("/api/auth/2fa/setup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", otp: twoFaOtp }),
    });

    const data = await res.json();

    if (!res.ok) {
      setTwoFaError(data.error || "Invalid OTP");
      return;
    }

    toast.success("2FA Enabled!");
    setIs2faModalOpen(false);
    updatePreference("security", { twoFactorEnabled: true });
  } catch (e) {
    setTwoFaError("Something went wrong. Please try again.");
  } finally {
    setIs2faVerifying(false);
  }
};
    const handleSaveAccount = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (editName.trim()) {
                localStorage.setItem("userName", editName);
                setUserName(editName);
                window.dispatchEvent(new Event("profileUpdated"));
            }
            toast.success("Settings saved successfully!");
        }, 1000);
    };

    const handlePreferenceChange = async (category: string, key: string, value: any) => {
        setIsSavingPreferences(true);
        try {
            let updatedPrefs = { ...preferences };

            if (category === "root") {
                updatedPrefs[key as keyof typeof preferences] = value;
                updatePreference(key as any, value);
            } else {
                updatedPrefs[category as keyof typeof preferences] = {
                    ...updatedPrefs[category as keyof typeof preferences] as any,
                    [key]: value
                };
                updatePreference(category as any, { [key]: value });
            }

            const res = await fetch("/api/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferences: updatedPrefs }),
            });
            
            if (!res.ok) throw new Error();
            toast.success("Preferences updated securely!");
        } catch(e) {
            toast.error("Failed to save preference to database.");
        } finally {
            setIsSavingPreferences(false);
        }
    };

    // Password Update Logic
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("New passwords do not match!");
        }
        if (newPassword.length < 8) {
            return toast.error("Password must be at least 8 characters.");
        }

        setIsUpdatingPassword(true);
        try {
            const res = await fetch("/api/auth/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update password");
            
            toast.success("Password updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const markAsRead = async (id?: string) => {
        try {
            const res = await fetch("/api/notifications/read", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(id ? { notificationId: id } : {}),
            });
            if (res.ok) {
                if (id) {
                    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
                } else {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }
            }
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const createDummyNotification = async () => {
        try {
            await fetch("/api/notifications/dummy", { method: "POST" });
            fetchNotifications();
            toast.success("Dummy notifications generated!");
        } catch(error) {
            toast.error("Failed to generate dummy notifications");
        }
    };

    if (isPageLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-text-muted">Loading...</div></div>;
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen">
            <Navbar role={role || "student"} userName={userName} unreadCount={unreadCount} />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-display text-text-primary">{t('settings')}</h1>
                    <p className="text-text-secondary mt-1">{t('settings_desc')}</p>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="space-y-1">
                        <button 
                            onClick={() => setActiveTab("account")}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === "account" ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20" : "text-text-muted hover:text-text-primary hover:bg-white/5"}`}
                        >
                            <User className="w-4 h-4" /> {t('account')}
                        </button>
                        <button 
                            onClick={() => setActiveTab("notifications")}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === "notifications" ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20" : "text-text-muted hover:text-text-primary hover:bg-white/5"}`}
                        >
                            <div className="flex items-center gap-3">
                                <Bell className="w-4 h-4" /> {t('notifications')}
                            </div>
                            {unreadCount > 0 && (
                                <span className="bg-neon-purple text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab("privacy")}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === "privacy" ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20" : "text-text-muted hover:text-text-primary hover:bg-white/5"}`}
                        >
                            <Lock className="w-4 h-4" /> {t('privacy')}
                        </button>
                        <button 
                            onClick={() => setActiveTab("preferences")}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === "preferences" ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20" : "text-text-muted hover:text-text-primary hover:bg-white/5"}`}
                        >
                            <Laptop className="w-4 h-4" /> {t('preferences')}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3 space-y-6">
                        {activeTab === "account" && (
                            <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                <div className="p-6 border-b border-white/5">
                                    <h2 className="text-xl font-semibold text-text-primary mb-1">{t('account_info')}</h2>
                                    <p className="text-sm text-text-muted">{t('update_profile')}</p>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handleSaveAccount} className="space-y-5">
                                        <Input 
                                            label={t('display_name')}
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Your name" 
                                        />
                                        <Input 
                                            label={t('email_address')}
                                            type="email" 
                                            value={email}
                                            disabled
                                            placeholder="you@example.com" 
                                            helperText="To change your core email, please contact support."
                                        />
                                        <div className="pt-4 border-t border-white/5 flex justify-end">
                                            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
                                                {t('save_changes')}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </section>
                        )}
                        
                        {activeTab === "privacy" && (
                            <>
                                {/* Password Settings */}
                                <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-6 border-b border-white/5">
                                        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center gap-2">
                                            <Key className="w-5 h-5 text-neon-cyan" /> Authentication
                                        </h2>
                                        <p className="text-sm text-text-muted">Ensure your account is using a secure password scheme.</p>
                                    </div>
                                    <div className="p-6">
                                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                                            <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                                            <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} helperText="Minimum 8 characters." required />
                                            <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                            <div className="pt-4 flex justify-end">
                                                <Button type="submit" variant="secondary" isLoading={isUpdatingPassword}>
                                                    Update Password
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="p-6 border-t border-white/5 flex items-center justify-between bg-surface-2/30">
                                        <div>
                                            <h4 className="text-sm font-medium text-text-primary">Two-Factor Authentication (2FA)</h4>
                                            <p className="text-xs text-text-muted mt-1">Requires an OTP upon login.</p>
                                        </div>
                                        <button 
                                            onClick={handleToggle2FA}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${preferences.security.twoFactorEnabled ? 'bg-neon-green' : 'bg-border-bright'}`}
                                        >
                                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.security.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </section>

                                {/* Privacy Controls */}
                                <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-6 border-b border-white/5">
                                        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center gap-2">
                                            <Eye className="w-5 h-5 text-neon-purple" /> Data Visibility
                                        </h2>
                                        <p className="text-sm text-text-muted">Control what external users and engines see.</p>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {/* Global Profile Switch */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-3">Overall Profile Alignment</label>
                                            <select 
                                                value={preferences.privacy.profileVisibility}
                                                onChange={(e) => handlePreferenceChange("privacy", "profileVisibility", e.target.value)}
                                                className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="public">Public (Visible to organizations)</option>
                                                <option value="private">Private (Only you can access)</option>
                                            </select>
                                        </div>

                                        <div className="h-px bg-white/5" />

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-text-primary">Direct Contact Index / Email Share</h4>
                                                <p className="text-xs text-text-muted mt-1">Expose email identity on profile renders.</p>
                                            </div>
                                            <button 
                                                onClick={() => handlePreferenceChange("privacy", "showEmail", !preferences.privacy.showEmail)}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${preferences.privacy.showEmail ? 'bg-neon-purple' : 'bg-border-bright'}`}
                                            >
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.privacy.showEmail ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-text-primary">Search Engine Crawler Access</h4>
                                                <p className="text-xs text-text-muted mt-1">Allow bots like Google to index your portfolios.</p>
                                            </div>
                                            <button 
                                                onClick={() => handlePreferenceChange("privacy", "showToSearchEngines", !preferences.privacy.showToSearchEngines)}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${preferences.privacy.showToSearchEngines ? 'bg-neon-purple' : 'bg-border-bright'}`}
                                            >
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.privacy.showToSearchEngines ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Sessions Dashboard */}
                                <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-6 border-b border-white/5">
                                        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center gap-2">
                                            <MonitorSmartphone className="w-5 h-5 text-neon-blue" /> Session Traces
                                        </h2>
                                        <p className="text-sm text-text-muted">Revoke persistent cookies and secure ghost sessions.</p>
                                    </div>
                                    <div className="p-0">
                                        <div className="divide-y divide-white/5">
                                            <div className="p-5 flex items-center justify-between bg-neon-blue/5">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-text-primary">Windows PC (Current)</h4>
                                                    <p className="text-xs text-neon-cyan mt-1">IP: 192.168.1.42 • Chrome Browser</p>
                                                </div>
                                                <span className="text-xs uppercase bg-white/5 text-text-muted px-2 py-1 rounded">Active</span>
                                            </div>
                                            <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-text-secondary">iPhone 14 Pro Max</h4>
                                                    <p className="text-xs text-text-muted mt-1">Location: Unknown • Safari Tracker</p>
                                                </div>
                                                <button className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                                            </div>
                                        </div>
                                        <div className="p-5 border-t border-white/5 flex justify-end">
                                            <Button variant="outline" size="sm" onClick={() => toast.success("Forced logged out from all distinct vectors.")}>
                                                Log Out Of All Remote Devices
                                            </Button>
                                        </div>
                                    </div>
                                </section>

                                {/* Danger Controls */}
                                <section className="glass rounded-2xl border border-red-500/20 overflow-hidden bg-red-500/5 mt-8">
                                    <div className="p-6 border-b border-red-500/10">
                                        <h2 className="text-xl font-semibold text-red-400 mb-1 flex items-center gap-2">
                                            <Shield className="w-5 h-5" /> Account Closure & Operations
                                        </h2>
                                        <p className="text-sm text-red-400/70">Proceed with maximum caution. Deletion destroys data permanently.</p>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-medium text-text-primary">Request Database Archival</h3>
                                                <p className="text-sm text-text-muted mt-1">We will generate and mail a zipped instance of your activity logs.</p>
                                            </div>
                                            <Button variant="outline" className="w-full sm:w-auto" onClick={() => toast.success("Process started. Monitor email.")} leftIcon={<Share2 className="w-4 h-4" />}>
                                                Download Data
                                            </Button>
                                        </div>

                                        <div className="h-px bg-red-500/10" />

                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-medium text-red-400">Total Account Purge</h3>
                                                <p className="text-sm text-text-muted mt-1">Permanently decouple all associations tracking with this identity.</p>
                                            </div>
                                            <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10 w-full sm:w-auto" onClick={() => toast("Delete flow modal mock...", { icon: '⚠️' })} leftIcon={<UserX className="w-4 h-4"/>}>
                                                Delete Account
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}


                        {activeTab === "preferences" && (
                            <>
                                <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-6 border-b border-white/5">
                                        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-neon-cyan" /> {t('interface_settings')}
                                        </h2>
                                        <p className="text-sm text-text-muted">{t('interface_customize')}</p>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {/* Theme Toggle */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-3">{t('theme_system')}</label>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => handlePreferenceChange("root", "theme", "dark")}
                                                    className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${preferences.theme === 'dark' ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan' : 'glass border-white/10 text-text-muted hover:border-white/30'}`}
                                                >
                                                    <Moon className="w-6 h-6" />
                                                    <span className="text-sm font-medium">{t('dark_mode')}</span>
                                                </button>
                                                <button 
                                                    onClick={() => handlePreferenceChange("root", "theme", "light")}
                                                    className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${preferences.theme === 'light' ? 'bg-neon-orange/10 border-neon-orange text-neon-orange' : 'glass border-white/10 text-text-muted hover:border-white/30'}`}
                                                >
                                                    <Sun className="w-6 h-6" />
                                                    <span className="text-sm font-medium">{t('light_mode')}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5" />

                                        {/* Language Settings */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-3">{t('display_language')}</label>
                                            <select 
                                                value={preferences.language}
                                                onChange={(e) => handlePreferenceChange("root", "language", e.target.value)}
                                                className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="English">English</option>
                                                <option value="Hindi">Hindi (हिंदी)</option>
                                                <option value="Spanish">Spanish</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-6 border-b border-white/5">
                                        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center gap-2">
                                            <LayoutDashboard className="w-5 h-5 text-neon-purple" /> User Interface Features
                                        </h2>
                                        <p className="text-sm text-text-muted">Adjust text sizing and structural spacing.</p>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {/* UI Compact Mode Toggle */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-text-primary">Compact Mode</h4>
                                                <p className="text-xs text-text-muted mt-1">Shrink line sizing to fit more dense information</p>
                                            </div>
                                            <button 
                                                onClick={() => handlePreferenceChange("ui", "compactMode", !preferences.ui.compactMode)}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${preferences.ui.compactMode ? 'bg-neon-purple' : 'bg-border-bright'}`}
                                            >
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.ui.compactMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        
                                        {/* Font Selector */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2"><Type className="w-4 h-4" /> Global Font Size</label>
                                            <select 
                                                value={preferences.ui.fontSize}
                                                onChange={(e) => handlePreferenceChange("ui", "fontSize", e.target.value)}
                                                className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="Small">Small (14px)</option>
                                                <option value="Medium">Medium (16px) Default</option>
                                                <option value="Large">Large (18px)</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-6 border-b border-white/5">
                                        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center gap-2">
                                            <Bell className="w-5 h-5 text-neon-green" /> Delivery Preferences
                                        </h2>
                                        <p className="text-sm text-text-muted">Dictate how we communicate with you externally.</p>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-text-primary">Email Notifications</h4>
                                                <p className="text-xs text-text-muted mt-1">Receive weekly summaries and important updates in your inbox.</p>
                                            </div>
                                            <button 
                                                onClick={() => handlePreferenceChange("notifications", "email", !preferences.notifications.email)}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${preferences.notifications.email ? 'bg-neon-green' : 'bg-border-bright'}`}
                                            >
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.notifications.email ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-text-primary">Push Notifications</h4>
                                                <p className="text-xs text-text-muted mt-1">Direct system messages embedded into this application.</p>
                                            </div>
                                            <button 
                                                onClick={() => handlePreferenceChange("notifications", "push", !preferences.notifications.push)}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${preferences.notifications.push ? 'bg-neon-green' : 'bg-border-bright'}`}
                                            >
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.notifications.push ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-text-primary">SMS Alerts</h4>
                                                <p className="text-xs text-text-muted mt-1">Immediate texting for critical account actions.</p>
                                            </div>
                                            <button 
                                                onClick={() => handlePreferenceChange("notifications", "sms", !preferences.notifications.sms)}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${preferences.notifications.sms ? 'bg-neon-green' : 'bg-border-bright'}`}
                                            >
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.notifications.sms ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {activeTab === "notifications" && (
                            <section className="glass rounded-2xl border border-white/10 overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-text-primary mb-1">Notifications</h2>
                                        <p className="text-sm text-text-muted">Stay updated with activity related to your account.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={createDummyNotification}>
                                            Test Notification
                                        </Button>
                                        {unreadCount > 0 && (
                                            <Button variant="secondary" size="sm" onClick={() => markAsRead()}>
                                                Mark all read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-0">
                                    {isFetchingNotifications ? (
                                        <div className="p-8 text-center text-text-muted">Loading notifications...</div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-12 text-center flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-text-muted">
                                                <Bell className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-lg font-medium text-text-primary mb-2">No notifications yet</h3>
                                            <p className="text-text-muted text-sm max-w-sm">When you get notifications, they'll show up here.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {notifications.map((notification) => (
                                                <div 
                                                    key={notification._id} 
                                                    className={`p-5 flex gap-4 transition-colors ${!notification.read ? "bg-neon-cyan/5" : "hover:bg-white/5"}`}
                                                >
                                                    <div className="mt-1">
                                                        {!notification.read ? (
                                                            <div className="w-2 h-2 rounded-full bg-neon-cyan mt-1.5" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4 text-text-muted mt-0.5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={`text-sm font-medium ${!notification.read ? "text-text-primary" : "text-text-secondary"}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-sm text-text-muted mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-text-muted">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(notification.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    {!notification.read && (
                                                        <button 
                                                            onClick={() => markAsRead(notification._id)}
                                                            className="text-xs font-medium text-neon-cyan hover:text-neon-cyan/80 transition-colors self-start whitespace-nowrap"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* 2FA Setup Modal */}
            {is2faModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl relative">
                        <div className="absolute top-4 right-4">
                            <button onClick={() => setIs2faModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                                &times;
                            </button>
                        </div>
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Lock className="w-6 h-6 text-neon-cyan" />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">Enable 2FA</h3>
                            <p className="text-sm text-text-muted mt-1">We've sent a 6-digit security code to your email. Enter it below to enable Two-Factor Authentication.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <Input
                                label="Security Code"
                                type="text"
                                placeholder="000000"
                                value={twoFaOtp}
                                onChange={(e) => { setTwoFaOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setTwoFaError(""); }}
                                error={twoFaError}
                                className="text-center font-mono text-xl tracking-[0.5em]"
                            />
                            
                            <Button 
                                variant="primary" 
                                className="w-full" 
                                onClick={handleVerify2FASetup} 
                                isLoading={is2faVerifying}
                            >
                                Verify & Enable
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
