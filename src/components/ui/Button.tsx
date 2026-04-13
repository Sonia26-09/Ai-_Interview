"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "neon-cyan" | "neon-purple" | "neon-green";
    size?: "sm" | "md" | "lg" | "xl";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
        const base =
            "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none relative overflow-hidden";

        const variants = {
            primary:
                "bg-gradient-to-r from-neon-cyan to-neon-purple text-background hover:shadow-neon-cyan hover:scale-[1.02] active:scale-[0.98] focus:ring-neon-cyan/50",
            secondary:
                "bg-surface-2 border border-border text-text-primary hover:border-border-bright hover:bg-white/5 focus:ring-white/20",
            ghost:
                "text-text-secondary hover:text-text-primary hover:bg-white/5 focus:ring-white/20",
            outline:
                "border border-border-bright text-text-primary bg-transparent hover:bg-white/5 hover:border-neon-cyan/40 focus:ring-neon-cyan/30",
            danger:
                "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 focus:ring-red-500/30",
            "neon-cyan":
                "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan hover:scale-[1.02] active:scale-[0.98] focus:ring-neon-cyan/40",
            "neon-purple":
                "bg-neon-purple/10 border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20 hover:shadow-neon-purple hover:scale-[1.02] active:scale-[0.98] focus:ring-neon-purple/40",
            "neon-green":
                "bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 hover:shadow-neon-green hover:scale-[1.02] active:scale-[0.98] focus:ring-neon-green/40",
        };

        const sizes = {
            sm: "text-xs px-3 py-1.5 h-7",
            md: "text-sm px-4 py-2 h-9",
            lg: "text-sm px-5 py-2.5 h-10",
            xl: "text-base px-7 py-3 h-12",
        };

        return (
            <button
                ref={ref}
                className={cn(base, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                    </>
                ) : (
                    <>
                        {leftIcon}
                        {children}
                        {rightIcon}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
export default Button;
