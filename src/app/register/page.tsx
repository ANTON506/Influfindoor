"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [role, setRole] = useState<"COMPANY" | "INFLUENCER">("COMPANY");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = { email, password, fullName, role };
            if (role === "COMPANY") {
                payload.companyName = companyName;
            }

            const { data } = await api.post("/auth/register", payload);
            login(data.token, data.user);

            toast.success("Account created successfully");

            if (role === "COMPANY") router.push("/company/dashboard");
            else router.push("/influencer/dashboard");

        } catch (error: any) {
            toast.error(error.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 grid-bg">
            <Card className="w-full max-w-md bg-black/60 border border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_30px_-10px_rgba(255,0,0,0.3)]">
                <CardHeader className="space-y-4 border-b border-white/5 pb-6">
                    <CardTitle className="text-3xl font-pixel tracking-widest text-center text-primary uppercase">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-center font-pixel text-xs text-muted-foreground uppercase tracking-widest">
                        Join as Company or Creator
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs defaultValue="COMPANY" onValueChange={(v) => setRole(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 border border-white/5 rounded-none p-1">
                            <TabsTrigger value="COMPANY" className="rounded-none font-pixel uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Company</TabsTrigger>
                            <TabsTrigger value="INFLUENCER" className="rounded-none font-pixel uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Creator</TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="JOHN DOE"
                                    className="rounded-none border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary font-pixel text-sm"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            {role === "COMPANY" && (
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="ACME CORP"
                                        className="rounded-none border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary font-pixel text-sm"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

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
                                    required minLength={6}
                                />
                            </div>

                            <Button className="w-full rounded-none bg-primary hover:bg-primary/80 font-pixel tracking-widest uppercase mt-4" type="submit" disabled={loading}>
                                {loading ? "Authenticating..." : "Initialize Profile"}
                            </Button>
                        </form>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 border-t border-white/5 pt-6">
                    <div className="text-xs font-pixel tracking-widest uppercase text-muted-foreground text-center">
                        Currently enrolled?{" "}
                        <Link href="/login" className="text-primary hover:text-white transition-colors">
                            Authenticate Here
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
