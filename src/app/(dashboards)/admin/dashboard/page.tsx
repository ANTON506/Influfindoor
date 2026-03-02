"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data } = await api.get("/applications");
                setApplications(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-primary/20 pb-6">
                <div>
                    <h2 className="text-4xl font-pixel text-primary uppercase tracking-widest">Admin Overview</h2>
                    <p className="text-muted-foreground font-pixel tracking-widest uppercase mt-2">Monitor platform activity and resolve disputes.</p>
                </div>
            </div>

            <Card className="bg-black/60 border border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_15px_-5px_rgba(255,0,0,0.1)]">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="font-pixel uppercase tracking-widest text-2xl text-primary">Recent Activity Pipeline</CardTitle>
                    <CardDescription className="font-pixel tracking-widest uppercase text-xs pt-1 text-muted-foreground">View all state machine transitions</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="font-pixel tracking-widest uppercase text-white">Campaign</TableHead>
                                <TableHead className="font-pixel tracking-widest uppercase text-white">Influencer</TableHead>
                                <TableHead className="font-pixel tracking-widest uppercase text-white">Status</TableHead>
                                <TableHead className="font-pixel tracking-widest uppercase text-white">Applied At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.slice(0, 10).map((app) => (
                                <TableRow key={app.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-pixel text-muted-foreground">{app.campaignId.substring(0, 8)}...</TableCell>
                                    <TableCell className="font-pixel text-muted-foreground">{app.influencerId.substring(0, 8)}...</TableCell>
                                    <TableCell>
                                        <Badge className="rounded-none bg-primary/10 text-primary border-primary/40 font-pixel uppercase tracking-widest text-[10px] px-2 py-0">{app.status}</Badge>
                                    </TableCell>
                                    <TableCell className="font-pixel text-muted-foreground">{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
