"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, leftIcon, rightIcon, helperText, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    {leftIcon && (
                        <div className="absolute left-3 text-text-muted pointer-events-none">{leftIcon}</div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted",
                            "px-4 py-2.5 h-10 transition-all duration-200",
                            "focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 focus:bg-surface",
                            "hover:border-border-bright",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error && "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10",
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 text-text-muted">{rightIcon}</div>
                    )}
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;
