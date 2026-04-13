import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientPreferencesProvider from "@/components/providers/ClientPreferencesProvider";
export const metadata: Metadata = {
    title: "AiMock — AI-Powered Interview Platform",
    description:
        "Next-generation AI mock interview platform for recruiters and candidates. Practice with AI, ace your interviews.",
    keywords: ["mock interview", "AI interview", "coding practice", "HR interview", "aptitude test"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-background text-text-primary antialiased">
                <ClientPreferencesProvider>
                    <div className="bg-orb bg-orb-1" />
                    <div className="bg-orb bg-orb-2" />
                    <div className="bg-orb bg-orb-3" />
                    <div className="relative z-10">{children}</div>
                    <Toaster position="top-center" />
                </ClientPreferencesProvider>
            </body>
        </html>
    );
}
