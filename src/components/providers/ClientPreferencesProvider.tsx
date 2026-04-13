"use client";

import { useEffect, useState } from "react";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import i18n from "@/lib/i18n";

export default function ClientPreferencesProvider({ children }: { children: React.ReactNode }) {
    const preferences = usePreferencesStore((state) => state.preferences);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const html = document.documentElement;
        
        // Apply theme
        if (preferences.theme === "light") {
            html.setAttribute("data-theme", "light");
        } else {
            html.removeAttribute("data-theme");
        }

        // Apply compact mode
        if (preferences.ui.compactMode) {
            html.setAttribute("data-compact", "true");
        } else {
            html.removeAttribute("data-compact");
        }

        // Apply font size
        html.setAttribute("data-fontsize", preferences.ui.fontSize.toLowerCase());
        
        // Apply language
        const langMap: Record<string, string> = {
            "English": "en",
            "Hindi": "hi",
            "Spanish": "es"
        };
        const langCode = langMap[preferences.language] || "en";
        if (i18n.language !== langCode) {
            i18n.changeLanguage(langCode);
        }

    }, [preferences, mounted]);

    // Render children directly, avoid hydration mismatch by not changing HTML structure
    return <>{children}</>;
}
