import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Preferences {
    theme: "light" | "dark";
    language: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    ui: {
        compactMode: boolean;
        fontSize: "Small" | "Medium" | "Large";
    };
    privacy: {
        profileVisibility: "public" | "private";
        showEmail: boolean;
        showToSearchEngines: boolean;
        dataSharing: boolean;
    };
    security: {
        twoFactorEnabled: boolean;
    };
}

export const defaultPreferences: Preferences = {
    theme: "dark",
    language: "English",
    notifications: {
        email: true,
        push: true,
        sms: false,
    },
    ui: {
        compactMode: false,
        fontSize: "Medium",
    },
    privacy: {
        profileVisibility: "public",
        showEmail: false,
        showToSearchEngines: false,
        dataSharing: true,
    },
    security: {
        twoFactorEnabled: false,
    },
};

interface PreferencesState {
    preferences: Preferences;
    setPreferences: (prefs: Preferences) => void;
    updatePreference: (key: keyof Preferences, value: any) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            preferences: defaultPreferences,
            setPreferences: (prefs) => set({ preferences: prefs }),
            updatePreference: (key, value) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    [key]: typeof value === 'object' && !Array.isArray(value) 
                        ? { ...(state.preferences[key] as any), ...value }
                        : value
                }
            })),
        }),
        {
            name: "aimock-preferences-store",
        }
    )
);
