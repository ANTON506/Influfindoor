import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ApplicationStateMachine } from '../services/applicationStateMachine';

const applyCampaignSchema = z.object({
    campaignId: z.string().uuid()
});

export default async function applicationRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    const stateMachine = new ApplicationStateMachine(fastify.prisma);

    // POST /applications
    // Influencer applies to campaign
    fastify.post('/applications', async (request, reply) => {
        const user = request.user as { sub: string; role: string };

        if (user.role !== 'INFLUENCER') {
            return reply.status(403).send({ error: 'Only influencers can apply' });
        }

        try {
            const { campaignId } = applyCampaignSchema.parse(request.body);

            // Verify campaign exists and is active
            const campaign = await fastify.prisma.campaign.findUnique({
                where: { id: campaignId }
            });

            if (!campaign || campaign.status !== 'ACTIVE') {
                return reply.status(404).send({ error: 'Active campaign not found' });
            }

            // Find influencer and their linked socials
            const influencer = await fastify.prisma.influencerProfile.findUnique({
                where: { userId: user.sub },
                include: { socialAccounts: true }
            });

            if (!influencer) {
                return reply.status(404).send({ error: 'Influencer profile not found' });
            }

            // Check if they already applied
            const existing = await fastify.prisma.campaignApplication.findUnique({
                where: {
                    campaignId_influencerId: {
                        campaignId: campaignId,
                        influencerId: influencer.id
                    }
                }
            });

            if (existing) {
                return reply.status(400).send({ error: 'Already applied' });
            }

            // Very simple checks for MVP (taking max followers if multiple given platforms)
            const maxFollowers = influencer.socialAccounts.length > 0
                ? Math.max(...influencer.socialAccounts.map(s => s.followersCount))
                : 0;

            const maxAvgViews = influencer.socialAccounts.length > 0
                ? Math.max(...influencer.socialAccounts.map(s => s.avgViews30d))
                : 0;

            const requirementsMet = maxFollowers >= campaign.minFollowers && maxAvgViews >= campaign.minAvgViews;

            // Create Application
            const application = await fastify.prisma.campaignApplication.create({
                data: {
                    campaignId,
                    influencerId: influencer.id,
                    // capture immutable snapshot 
                    followersSnapshot: { followers: maxFollowers },
                    avgViewsSnapshot: { views: maxAvgViews },
                    requirementsMet,
                    status: 'APPLIED'
                }
            });

            // Audit Log for Initial Creation
            await fastify.prisma.auditLog.create({
                data: {
                    entityId: application.id,
                    entityType: 'Application',
                    actorId: user.sub,
                    actorType: 'USER',
                    action: 'APPLICATION_CREATED',
                    newValue: { requirementsMet }
                }
            });

            return reply.status(201).send(application);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.format() });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /applications/:id/transition
    const transitionSchema = z.object({
        status: z.enum([
            'PENDING_REVIEW', 'APPROVED_FOR_MOCK', 'MOCK_SUBMITTED', 'MOCK_REJECTED',
            'MOCK_APPROVED', 'AWAITING_PRODUCT', 'PRODUCT_RECEIVED', 'FINAL_SUBMITTED',
            'FINAL_REJECTED', 'FINAL_APPROVED', 'PENDING_PUBLICATION', 'PUBLISHED',
            'PAYMENT_RELEASED', 'AUTO_REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'
        ]),
        reason: z.string().optional()
    });

    fastify.post('/applications/:id/transition', async (request, reply) => {
        const user = request.user as { sub: string; role: string };
        const { id } = request.params as { id: string };

        try {
            const { status, reason } = transitionSchema.parse(request.body);

            const app = await fastify.prisma.campaignApplication.findUnique({
                where: { id },
                include: { campaign: true, influencer: true }
            });

            if (!app) {
                return reply.status(404).send({ error: 'Application not found' });
            }

            // Very rudimentary authorization layer for MVP
            const isInfluencerOwner = user.role === 'INFLUENCER' && app.influencer.userId === user.sub;

            let isCompanyOwner = false;
            if (user.role === 'COMPANY') {
                const companyProfile = await fastify.prisma.companyProfile.findUnique({ where: { userId: user.sub } });
                isCompanyOwner = !!companyProfile && app.campaign.companyId === companyProfile.id;
            }

            if (!isInfluencerOwner && !isCompanyOwner && user.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const updated = await stateMachine.transition(id, status as any, user.sub, reason);
            return reply.send(updated);

        } catch (error: any) {
            if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Validation failed', details: error.format() });
            if (error.message.includes('Invalid transition')) return reply.status(400).send({ error: error.message });

            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /applications
    // Lists applications (For COMPANY to review, or INFLUENCER to see theirs)
    fastify.get('/applications', async (request, reply) => {
        const user = request.user as { sub: string; role: string };

        try {
            if (user.role === 'INFLUENCER') {
                const profile = await fastify.prisma.influencerProfile.findUnique({ where: { userId: user.sub } });
                if (!profile) return reply.send([]);

                const apps = await fastify.prisma.campaignApplication.findMany({
                    where: { influencerId: profile.id },
                    include: { campaign: true }
                });
                return reply.send(apps);

            } else if (user.role === 'COMPANY') {
                const companyProfile = await fastify.prisma.companyProfile.findUnique({ where: { userId: user.sub } });
                if (!companyProfile) return reply.send([]);

                // Companies view applications for THEIR campaigns
                const companyApps = await fastify.prisma.campaignApplication.findMany({
                    where: { campaign: { companyId: companyProfile.id } },
                    include: {
                        influencer: { include: { socialAccounts: true } },
                        campaign: true
                    }
                });
                return reply.send(companyApps);
            } else {
                return reply.send(await fastify.prisma.campaignApplication.findMany());
            }
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
