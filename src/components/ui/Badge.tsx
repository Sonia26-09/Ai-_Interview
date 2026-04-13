import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "cyan" | "purple" | "green" | "orange" | "blue" | "pink" | "red" | "yellow";
    size?: "sm" | "md";
    className?: string;
    dot?: boolean;
}

const variantStyles = {
    default: "bg-white/10 text-text-secondary border-white/20",
    cyan: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30",
    purple: "bg-neon-purple/10 text-neon-purple border-neon-purple/30",
    green: "bg-neon-green/10 text-neon-green border-neon-green/30",
    orange: "bg-neon-orange/10 text-neon-orange border-neon-orange/30",
    blue: "bg-neon-blue/10 text-neon-blue border-neon-blue/30",
    pink: "bg-neon-pink/10 text-neon-pink border-neon-pink/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    yellow: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
};

export default function Badge({ children, variant = "default", size = "md", className, dot }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 font-medium border rounded-full",
                variantStyles[variant],
                size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
                className
            )}
        >
            {dot && (
                <span
                    className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        variant === "cyan" && "bg-neon-cyan",
                        variant === "purple" && "bg-neon-purple",
                        variant === "green" && "bg-neon-green",
                        variant === "orange" && "bg-neon-orange",
                        variant === "blue" && "bg-neon-blue",
                        variant === "red" && "bg-red-400",
                        variant === "yellow" && "bg-yellow-400",
                        variant === "default" && "bg-text-secondary"
                    )}
                />
            )}
            {children}
        </span>
    );
}
