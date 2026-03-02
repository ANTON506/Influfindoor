"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function InfluencerDashboard() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        try {
            const [campsRes, appsRes] = await Promise.all([
                api.get("/campaigns"),
                api.get("/applications")
            ]);
            setCampaigns(campsRes.data);
            setApplications(appsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const handleApply = async (campaignId: string) => {
        try {
            await api.post("/applications", { campaignId });
            toast.success("Successfully applied!");
            await load();
        } catch (error: any) {
            toast.error("Failed to apply");
        }
    };

    const handleTransition = async (appId: string, status: string) => {
        try {
            await api.post(`/applications/${appId}/transition`, { status });
            toast.success(`Action successful`);
            await load();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Action failed");
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2 border-b border-primary/20 pb-6">
                <h2 className="text-4xl font-pixel tracking-widest uppercase text-primary">Opportunities</h2>
                <p className="text-muted-foreground font-pixel tracking-widest uppercase">Find campaigns or track your applications.</p>
            </div>

            <Tabs defaultValue="discover" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-black/40 border border-white/5 rounded-none p-1">
                    <TabsTrigger value="discover" className="rounded-none font-pixel uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Discover Campaigns</TabsTrigger>
                    <TabsTrigger value="applications" className="rounded-none font-pixel uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">CRM Pipeline</TabsTrigger>
                </TabsList>

                <TabsContent value="discover" className="mt-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.length === 0 ? (
                            <p className="text-muted-foreground col-span-3 font-pixel tracking-widest uppercase text-center py-12">No active campaigns found.</p>
                        ) : (
                            campaigns.map((c) => (
                                <Card key={c.id} className="bg-black/60 border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_15px_-5px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_-5px_rgba(255,0,0,0.3)] transition-all">
                                    <CardHeader className="border-b border-white/5 pb-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <CardTitle className="line-clamp-2 text-xl font-pixel uppercase tracking-widest text-white">{c.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="text-sm font-pixel text-primary tracking-widest uppercase mb-6 border border-white/10 bg-white/5 p-3 text-center">
                                            Payout: ${(c.pricePerVideo / 100).toFixed(2)}
                                        </div>
                                        <div className="text-sm text-muted-foreground line-clamp-3 mb-8 font-pixel">{c.description}</div>
                                        {applications.some((a) => a.campaignId === c.id) ? (
                                            <Button className="w-full rounded-none font-pixel uppercase tracking-widest border border-white/20 bg-black/50 text-white/50" disabled>Already Applied</Button>
                                        ) : (
                                            <Button className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80" onClick={() => handleApply(c.id)}>Apply Now</Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="applications" className="mt-8">
                    <div className="flex overflow-x-auto gap-6 pb-6 min-h-[60vh] custom-scrollbar">
                        {/* Column 1 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Applied</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['APPLIED', 'PENDING_REVIEW', 'AUTO_REJECTED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['APPLIED', 'PENDING_REVIEW', 'AUTO_REJECTED'].includes(a.status)).map(app => (
                                <InfluencerCRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 2 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Accepted / Send Mock</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['APPROVED_FOR_MOCK', 'MOCK_REJECTED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['APPROVED_FOR_MOCK', 'MOCK_REJECTED'].includes(a.status)).map(app => (
                                <InfluencerCRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 3 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Mock Sent / Content</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['MOCK_SUBMITTED', 'MOCK_APPROVED', 'AWAITING_PRODUCT', 'PRODUCT_RECEIVED', 'FINAL_SUBMITTED', 'FINAL_REJECTED', 'FINAL_APPROVED', 'PENDING_PUBLICATION'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['MOCK_SUBMITTED', 'MOCK_APPROVED', 'AWAITING_PRODUCT', 'PRODUCT_RECEIVED', 'FINAL_SUBMITTED', 'FINAL_REJECTED', 'FINAL_APPROVED', 'PENDING_PUBLICATION'].includes(a.status)).map(app => (
                                <InfluencerCRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 4 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">To Pay</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['PUBLISHED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['PUBLISHED'].includes(a.status)).map(app => (
                                <InfluencerCRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 5 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Completed Campaigns</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['PAYMENT_RELEASED', 'DISPUTED', 'REFUNDED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['PAYMENT_RELEASED', 'DISPUTED', 'REFUNDED'].includes(a.status)).map(app => (
                                <InfluencerCRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfluencerCRMCard({ app, handleTransition }: { app: any, handleTransition: (id: string, status: string) => void }) {
    const actionNeeded = ['APPROVED_FOR_MOCK', 'MOCK_REJECTED', 'PRODUCT_RECEIVED', 'FINAL_REJECTED', 'PENDING_PUBLICATION'].includes(app.status);

    return (
        <Card className={`bg-black/80 border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_10px_-5px_rgba(255,0,0,0.2)] p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors ${app.status === 'MOCK_REJECTED' || app.status === 'FINAL_REJECTED' ? 'border-destructive border-dashed border-2 bg-destructive/5' : ''}`}>
            {(app.status === 'MOCK_REJECTED' || app.status === 'FINAL_REJECTED') && (
                <div className="bg-destructive text-white rounded-none w-fit text-[10px] font-pixel tracking-widest uppercase px-2 py-1 mb-1">
                    {app.status === 'MOCK_REJECTED' ? 'DENIED MOCK / SEND AGAIN' : 'DENIED FINAL / SEND AGAIN'}
                </div>
            )}
            <div className="flex flex-col">
                <h4 className="font-pixel uppercase tracking-widest text-primary text-xs truncate" title={app.campaign.title}>Campaign: {app.campaign.title}</h4>
                <div className="flex justify-between items-center mt-3">
                    <Badge className="rounded-none bg-white/5 text-muted-foreground border-white/10 font-pixel uppercase tracking-widest text-[10px] px-2">{app.status.replace(/_/g, ' ')}</Badge>
                </div>
            </div>

            <div className={`flex flex-col gap-2 pt-3 border-t border-white/10 mt-1 ${!actionNeeded ? 'items-center' : ''}`}>
                {actionNeeded ? (
                    <>
                        {['APPROVED_FOR_MOCK', 'MOCK_REJECTED'].includes(app.status) && (
                            <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'MOCK_SUBMITTED')}>Submit Mock Video</Button>
                        )}
                        {['PRODUCT_RECEIVED', 'FINAL_REJECTED'].includes(app.status) && (
                            <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'FINAL_SUBMITTED')}>Submit Final Video</Button>
                        )}
                        {app.status === 'PENDING_PUBLICATION' && (
                            <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'PUBLISHED')}>Verify TikTok Post</Button>
                        )}
                    </>
                ) : (
                    <span className="text-muted-foreground font-pixel uppercase tracking-widest text-[9px]">Awaiting Brand / Action</span>
                )}
            </div>
        </Card>
    );
}
