import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CampaignStatus } from '@prisma/client';

const createCampaignSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    pricePerVideo: z.number().positive(),
    platform: z.enum(['TIKTOK', 'INSTAGRAM', 'BOTH']),
    minFollowers: z.number().min(0),
    minAvgViews: z.number().min(0),
    deliverableDuration: z.number().positive(),
    productDeliveryMethod: z.enum(['COMPANY_SHIPS', 'INFLUENCER_BUYS_REIMBURSED']),
    applicationDeadline: z.string().datetime(),
    productionDeadline: z.string().datetime()
});

export default async function campaignRoutes(fastify: FastifyInstance) {
    // Add authentication hook to all campaign routes
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // GET /campaigns (Open campaigns for influencers, or company's own campaigns)
    fastify.get('/campaigns', async (request, reply) => {
        const user = request.user as { sub: string; role: string };

        try {
            if (user.role === 'INFLUENCER') {
                const campaigns = await fastify.prisma.campaign.findMany({
                    where: { status: 'ACTIVE' },
                    include: { company: { select: { companyName: true } } }
                });
                return reply.send(campaigns);
            } else if (user.role === 'COMPANY') {
                const companyProfile = await fastify.prisma.companyProfile.findUnique({ where: { userId: user.sub } });
                if (!companyProfile) return reply.send([]);

                const campaigns = await fastify.prisma.campaign.findMany({
                    where: { companyId: companyProfile.id }
                });
                return reply.send(campaigns);
            } else {
                // ADMIN can see all
                const campaigns = await fastify.prisma.campaign.findMany();
                return reply.send(campaigns);
            }
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /campaigns (Company only)
    fastify.post('/campaigns', async (request, reply) => {
        const user = request.user as { sub: string; role: string };

        if (user.role !== 'COMPANY') {
            return reply.status(403).send({ error: 'Only companies can create campaigns' });
        }

        try {
            const companyProfile = await fastify.prisma.companyProfile.findUnique({ where: { userId: user.sub } });
            if (!companyProfile) return reply.status(404).send({ error: 'Company profile not found' });

            const data = createCampaignSchema.parse(request.body);

            const campaign = await fastify.prisma.campaign.create({
                data: {
                    companyId: companyProfile.id,
                    title: data.title,
                    description: data.description,
                    pricePerVideo: data.pricePerVideo,
                    platform: data.platform,
                    minFollowers: data.minFollowers,
                    minAvgViews: data.minAvgViews,
                    deliverableDuration: data.deliverableDuration,
                    productDeliveryMethod: data.productDeliveryMethod,
                    applicationDeadline: new Date(data.applicationDeadline),
                    productionDeadline: new Date(data.productionDeadline),
                    status: 'DRAFT',
                }
            });

            return reply.status(201).send(campaign);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.format() });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /campaigns/:id/publish
    fastify.post('/campaigns/:id/publish', async (request, reply) => {
        const user = request.user as { sub: string; role: string };
        const { id } = request.params as { id: string };

        if (user.role !== 'COMPANY') {
            return reply.status(403).send({ error: 'Forbidden' });
        }

        try {
            const companyProfile = await fastify.prisma.companyProfile.findUnique({ where: { userId: user.sub } });
            if (!companyProfile) return reply.status(404).send({ error: 'Company profile not found' });

            // 1. Double check ownership
            const campaign = await fastify.prisma.campaign.findUnique({
                where: { id }
            });

            if (!campaign || campaign.companyId !== companyProfile.id) {
                return reply.status(404).send({ error: 'Campaign not found' });
            }

            if (campaign.status !== 'DRAFT') {
                return reply.status(400).send({ error: 'Campaign is not in DRAFT state' });
            }

            // MVP Stripe Integration Mock
            // In production, we would create a Stripe PaymentIntent here capturing funds
            // to the platform escrow until the job completes.
            console.log(`[Stripe Mock] Mocking PaymentIntent for campaign ${id}`);

            // 2. Publish
            const updated = await fastify.prisma.campaign.update({
                where: { id },
                data: { status: 'ACTIVE' }
            });

            return reply.send(updated);

        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
