import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export function getScoreColor(score: number): string {
    if (score >= 80) return "text-neon-green";
    if (score >= 60) return "text-neon-cyan";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
}

export function getScoreBg(score: number): string {
    if (score >= 80) return "bg-neon-green/10 border-neon-green/30";
    if (score >= 60) return "bg-neon-cyan/10 border-neon-cyan/30";
    if (score >= 40) return "bg-yellow-400/10 border-yellow-400/30";
    return "bg-red-400/10 border-red-400/30";
}

export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case "Easy": return "text-neon-green";
        case "Medium": return "text-yellow-400";
        case "Hard": return "text-red-400";
        default: return "text-text-secondary";
    }
}

export function getDifficultyBg(difficulty: string): string {
    switch (difficulty) {
        case "Easy": return "bg-neon-green/10 border-neon-green/30";
        case "Medium": return "bg-yellow-400/10 border-yellow-400/30";
        case "Hard": return "bg-red-400/10 border-red-400/30";
        default: return "bg-white/5 border-white/10";
    }
}

export function getRoundTypeColor(type: string): string {
    switch (type) {
        case "aptitude": return "text-neon-blue";
        case "coding": return "text-neon-cyan";
        case "hr": return "text-neon-purple";
        default: return "text-text-secondary";
    }
}

export function getRoundTypeIcon(type: string): string {
    switch (type) {
        case "aptitude": return "🧮";
        case "coding": return "💻";
        case "hr": return "🤝";
        default: return "📝";
    }
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export function timeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; percent: number } {
    const level = calculateLevel(xp);
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    return {
        current: xp - currentLevelXP,
        needed: nextLevelXP - currentLevelXP,
        percent: ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100,
    };
}
