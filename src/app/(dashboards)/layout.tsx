"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login"); // Protect route
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const roleLabels = {
        COMPANY: "Brand Dashboard",
        INFLUENCER: "Creator Dashboard",
        ADMIN: "Admin Portal"
    };

    return (
        <div className="min-h-screen grid-bg">
            <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-black/60 backdrop-blur-md supports-[backdrop-filter]:bg-black/40">
                <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="inline-block font-pixel font-bold text-3xl tracking-widest text-primary uppercase">
                                INFLUFINDOOR
                            </span>
                            <span className="hidden text-sm font-pixel tracking-widest text-muted-foreground uppercase sm:inline-block ml-4 border-l border-white/20 pl-4 py-1">
                                {roleLabels[user.role]}
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-pixel tracking-widest uppercase text-foreground bg-white/5 border border-white/10 px-4 py-2 rounded-none">
                            <UserIcon className="h-4 w-4 text-primary" />
                            {user.fullName}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout" className="rounded-none hover:bg-primary/20 hover:text-primary">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 md:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
