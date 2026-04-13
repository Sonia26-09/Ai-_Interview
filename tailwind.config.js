/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
                display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
            },
            colors: {
                background: "var(--bg-primary)",
                surface: "var(--bg-surface)",
                "surface-2": "var(--bg-surface-2)",
                border: "var(--border-color)",
                "border-bright": "var(--border-bright)",
                neon: {
                    cyan: "var(--neon-cyan)",
                    purple: "var(--neon-purple)",
                    pink: "var(--neon-pink)",
                    green: "var(--neon-green)",
                    blue: "var(--neon-blue)",
                    orange: "var(--neon-orange)",
                },
                text: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    muted: "var(--text-muted)",
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-mesh":
                    "radial-gradient(at 40% 20%, hsla(228,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.05) 0px, transparent 50%)",
                "card-gradient":
                    "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
            },
            boxShadow: {
                "neon-cyan": "0 0 20px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1)",
                "neon-purple": "0 0 20px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.1)",
                "neon-green": "0 0 20px rgba(0,255,136,0.3), 0 0 60px rgba(0,255,136,0.1)",
                glass: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                "glass-hover": "0 16px 48px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                card: "0 4px 24px rgba(0,0,0,0.2)",
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "spin-slow": "spin 8s linear infinite",
                float: "float 6s ease-in-out infinite",
                "glow-pulse": "glow-pulse 2s ease-in-out infinite",
                "slide-up": "slide-up 0.5s ease-out",
                "fade-in": "fade-in 0.3s ease-out",
                shimmer: "shimmer 2s linear infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-12px)" },
                },
                "glow-pulse": {
                    "0%, 100%": { opacity: "0.6" },
                    "50%": { opacity: "1" },
                },
                "slide-up": {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
        },
    },
    plugins: [],
};
