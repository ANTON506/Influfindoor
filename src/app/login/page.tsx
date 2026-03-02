"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { email, password });
            login(data.token, data.user);

            toast.success("Successfully logged in");

            // Redirect based on role
            if (data.user.role === "COMPANY") router.push("/company/dashboard");
            else if (data.user.role === "INFLUENCER") router.push("/influencer/dashboard");
            else router.push("/admin/dashboard");

        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center grid-bg">
            <Card className="w-full max-w-md bg-black/60 border border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_30px_-10px_rgba(255,0,0,0.3)]">
                <CardHeader className="space-y-4 border-b border-white/5 pb-6">
                    <CardTitle className="text-3xl font-pixel tracking-widest text-center text-primary uppercase">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-center font-pixel text-xs text-muted-foreground uppercase tracking-widest">
                        Initialize Session
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ACCESS_CODE@..."
                                className="rounded-none border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary font-pixel text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                className="rounded-none border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary font-pixel text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full rounded-none bg-primary hover:bg-primary/80 font-pixel tracking-widest uppercase mt-4" type="submit" disabled={loading}>
                            {loading ? "Authenticating..." : "Establish Connection"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 border-t border-white/5 pt-6">
                    <div className="text-xs font-pixel tracking-widest uppercase text-muted-foreground text-center">
                        Unregistered entity?{" "}
                        <Link href="/register" className="text-primary hover:text-white transition-colors">
                            Initialize Profile
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
