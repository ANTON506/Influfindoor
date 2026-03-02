"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function CompanyDashboard() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    async function load() {
        try {
            const [cRes, aRes] = await Promise.all([
                api.get("/campaigns"),
                api.get("/applications")
            ]);
            setCampaigns(cRes.data);
            setApplications(aRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post("/campaigns", {
                title,
                description,
                pricePerVideo: parseInt(price) * 100,
                platform: "TIKTOK",
                minFollowers: 0,
                minAvgViews: 0,
                deliverableDuration: 30,
                productDeliveryMethod: "COMPANY_SHIPS",
                applicationDeadline: new Date(Date.now() + 86400000 * 7).toISOString(),
                productionDeadline: new Date(Date.now() + 86400000 * 14).toISOString(),
            });
            toast.success("Campaign created as Draft");
            setOpen(false);
            await load();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create");
        } finally {
            setCreating(false);
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await api.post(`/campaigns/${id}/publish`);
            toast.success("Campaign published! (Stripe escrow mocked)");
            await load();
        } catch (error: any) {
            toast.error("Failed to publish");
        }
    };

    const handleTransition = async (appId: string, status: string) => {
        try {
            await api.post(`/applications/${appId}/transition`, { status });
            toast.success(`Moved to ${status}`);
            await load();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Transition failed");
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-primary/20 pb-6">
                <div>
                    <h2 className="text-4xl font-pixel text-primary uppercase tracking-widest">Company Dashboard</h2>
                    <p className="text-muted-foreground font-pixel tracking-widest uppercase mt-2">Manage campaigns and review creator applications.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 rounded-none bg-primary hover:bg-primary/80 font-pixel tracking-widest uppercase">
                            <PlusCircle className="h-4 w-4" />
                            Create Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black/90 border border-primary/40 rounded-none backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="font-pixel text-2xl text-primary uppercase tracking-widest border-b border-white/10 pb-4">Create Campaign</DialogTitle>
                            <DialogDescription className="font-pixel uppercase tracking-widest text-xs pt-2">Draft a new campaign.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-6 mt-4">
                            <div className="space-y-2">
                                <Label className="font-pixel uppercase tracking-widest text-muted-foreground">Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} required minLength={5} className="font-pixel rounded-none border-white/10 bg-white/5 focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-pixel uppercase tracking-widest text-muted-foreground">Description</Label>
                                <Input value={description} onChange={e => setDescription(e.target.value)} required minLength={10} className="font-pixel rounded-none border-white/10 bg-white/5 focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-pixel uppercase tracking-widest text-muted-foreground">Price Per Video (USD)</Label>
                                <Input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} required className="font-pixel rounded-none border-white/10 bg-white/5 focus-visible:ring-primary" />
                            </div>
                            <Button type="submit" className="w-full rounded-none bg-primary hover:bg-primary/80 font-pixel tracking-widest uppercase mt-6" disabled={creating}>
                                {creating ? "Saving..." : "Save Draft"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8 bg-black/40 border border-white/5 rounded-none p-1">
                    <TabsTrigger value="overview" className="rounded-none font-pixel uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
                    <TabsTrigger value="campaigns" className="rounded-none font-pixel uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">My Campaigns</TabsTrigger>
                    <TabsTrigger value="pipeline" className="rounded-none font-pixel uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">CRM Pipeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-8 space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="bg-black/60 border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_15px_-5px_rgba(255,0,0,0.1)]">
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="font-pixel uppercase tracking-widest text-white text-lg">Active Campaigns</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-5xl font-pixel text-primary">{campaigns.filter(c => c.status !== 'DRAFT').length}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-black/60 border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_15px_-5px_rgba(255,0,0,0.1)]">
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="font-pixel uppercase tracking-widest text-white text-lg">Total Applicants</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-5xl font-pixel text-primary">{applications.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-black/60 border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_15px_-5px_rgba(255,0,0,0.1)]">
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="font-pixel uppercase tracking-widest text-white text-lg">Budget Allocated</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-5xl font-pixel text-primary">${(campaigns.reduce((acc, c) => acc + c.pricePerVideo, 0) / 100).toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="campaigns" className="mt-8">
                    {campaigns.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center p-12 text-center bg-black/50 border-white/10 rounded-none backdrop-blur-md">
                            <CardDescription className="font-pixel uppercase tracking-widest">You haven't created any campaigns yet.</CardDescription>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {campaigns.map((c) => (
                                <Card key={c.id} className="bg-black/60 border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_15px_-5px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_-5px_rgba(255,0,0,0.3)] transition-all">
                                    <CardHeader className="border-b border-white/5 pb-4">
                                        <CardTitle className="line-clamp-1 font-pixel uppercase tracking-widest text-xl">{c.title}</CardTitle>
                                        <Badge className="w-fit mt-2 rounded-none bg-primary/20 text-primary border-primary/40 font-pixel uppercase tracking-widest text-xs">{c.status}</Badge>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground mb-6 line-clamp-2 font-pixel">
                                            {c.description}
                                        </div>
                                        <div className="text-sm font-pixel text-white tracking-widest uppercase mb-6 border border-white/10 bg-white/5 p-3 text-center">
                                            Budget: ${(c.pricePerVideo / 100).toFixed(2)}
                                        </div>
                                        {c.status === 'DRAFT' && (
                                            <Button className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80" onClick={() => handlePublish(c.id)}>
                                                Publish (Pay Escrow)
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pipeline" className="mt-8">
                    <div className="flex overflow-x-auto gap-6 pb-6 min-h-[60vh] custom-scrollbar">
                        {/* Column 1 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Lead In</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['APPLIED', 'AUTO_REJECTED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['APPLIED', 'AUTO_REJECTED'].includes(a.status)).map(app => (
                                <CRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 2 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Mock Prod.</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['APPROVED_FOR_MOCK', 'MOCK_SUBMITTED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['APPROVED_FOR_MOCK', 'MOCK_SUBMITTED'].includes(a.status)).map(app => (
                                <CRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 3 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Product Phase</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['MOCK_APPROVED', 'AWAITING_PRODUCT', 'PRODUCT_RECEIVED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['MOCK_APPROVED', 'AWAITING_PRODUCT', 'PRODUCT_RECEIVED'].includes(a.status)).map(app => (
                                <CRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 4 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Final Review</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['FINAL_SUBMITTED', 'FINAL_APPROVED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['FINAL_SUBMITTED', 'FINAL_APPROVED'].includes(a.status)).map(app => (
                                <CRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>

                        {/* Column 5 */}
                        <div className="flex-shrink-0 w-[300px] flex flex-col gap-4">
                            <div className="border border-white/10 bg-black/40 p-3 flex justify-between items-center rounded-none backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <h3 className="font-pixel uppercase tracking-widest text-white">Payout</h3>
                                <Badge className="bg-white/5 text-muted-foreground font-pixel rounded-none border-white/10">{applications.filter(a => ['PENDING_PUBLICATION', 'PUBLISHED', 'PAYMENT_RELEASED', 'DISPUTED'].includes(a.status)).length}</Badge>
                            </div>
                            {applications.filter(a => ['PENDING_PUBLICATION', 'PUBLISHED', 'PAYMENT_RELEASED', 'DISPUTED'].includes(a.status)).map(app => (
                                <CRMCard key={app.id} app={app} handleTransition={handleTransition} />
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CRMCard({ app, handleTransition }: { app: any, handleTransition: (id: string, status: string) => void }) {
    const actionNeeded = ['APPLIED', 'MOCK_SUBMITTED', 'AWAITING_PRODUCT', 'FINAL_SUBMITTED', 'PUBLISHED'].includes(app.status);

    return (
        <Card className="bg-black/80 border-primary/20 backdrop-blur-md rounded-none shadow-[0_0_10px_-5px_rgba(255,0,0,0.2)] p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors">
            <div className="flex flex-col">
                <h4 className="font-pixel uppercase tracking-widest text-primary text-xs truncate" title={app.campaign.title}>Campaign: {app.campaign.title}</h4>
                <p className="font-pixel tracking-widest text-white mt-1 text-[17px] uppercase">{app.influencer.user?.fullName || "Influencer"}</p>
                <div className="flex justify-between items-center mt-3">
                    <Badge className="rounded-none bg-white/5 text-muted-foreground border-white/10 font-pixel uppercase tracking-widest text-[10px] px-2">{app.status.replace(/_/g, ' ')}</Badge>
                </div>
            </div>

            <div className={`flex flex-col gap-2 pt-3 border-t border-white/10 mt-1 ${!actionNeeded ? 'items-center' : ''}`}>
                {actionNeeded ? (
                    <>
                        {app.status === 'APPLIED' && (
                            <>
                                <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'APPROVED_FOR_MOCK')}>Approve For Mock</Button>
                                <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest border border-destructive/50 hover:bg-destructive/10 text-destructive h-8 text-xs" variant="outline" onClick={() => handleTransition(app.id, 'AUTO_REJECTED')}>Reject</Button>
                            </>
                        )}
                        {app.status === 'MOCK_SUBMITTED' && (
                            <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'MOCK_APPROVED')}>Approve Mock Video</Button>
                        )}
                        {app.status === 'AWAITING_PRODUCT' && (
                            <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'PRODUCT_RECEIVED')}>Mark Product Sent</Button>
                        )}
                        {app.status === 'FINAL_SUBMITTED' && (
                            <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'FINAL_APPROVED')}>Approve Final Content</Button>
                        )}
                        {app.status === 'PUBLISHED' && (
                            <Button size="sm" className="w-full rounded-none font-pixel uppercase tracking-widest bg-primary hover:bg-primary/80 h-8 text-xs" onClick={() => handleTransition(app.id, 'PAYMENT_RELEASED')}>Verify & Release Pay</Button>
                        )}
                    </>
                ) : (
                    <span className="text-muted-foreground font-pixel uppercase tracking-widest text-[9px]">Awaiting Influencer / Action</span>
                )}
            </div>
        </Card>
    );
}
