import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const updateInfluencerSchema = z.object({
    bio: z.string().optional(),
    country: z.string().optional(),
    socials: z.array(z.object({
        platform: z.enum(['TIKTOK', 'INSTAGRAM', 'BOTH']),
        handle: z.string(),
        followersCount: z.number().int().min(0),
        avgViews30d: z.number().int().min(0),
        engagementRate: z.number().min(0).max(100).optional(),
    })).optional()
});

const updateCompanySchema = z.object({
    companyName: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
});

export default async function profileRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // GET /profiles/me
    fastify.get('/profiles/me', async (request, reply) => {
        const user = request.user as { sub: string; role: string };

        try {
            if (user.role === 'INFLUENCER') {
                const profile = await fastify.prisma.influencerProfile.findUnique({
                    where: { userId: user.sub },
                    include: { socialAccounts: true }
                });
                return reply.send(profile);
            } else if (user.role === 'COMPANY') {
                const profile = await fastify.prisma.companyProfile.findUnique({
                    where: { userId: user.sub }
                });
                return reply.send(profile);
            } else {
                return reply.status(400).send({ error: 'Profile not mapped for Admin' });
            }
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PUT /profiles/me
    fastify.put('/profiles/me', async (request, reply) => {
        const user = request.user as { sub: string; role: string };

        try {
            if (user.role === 'INFLUENCER') {
                const data = updateInfluencerSchema.parse(request.body);

                // Find influencer ID
                const profile = await fastify.prisma.influencerProfile.findUnique({ where: { userId: user.sub } });
                if (!profile) return reply.status(404).send({ error: 'Profile not found ' });

                const updated = await fastify.prisma.$transaction(async (tx) => {
                    const p = await tx.influencerProfile.update({
                        where: { id: profile.id },
                        data: {
                            bio: data.bio,
                            country: data.country
                        }
                    });

                    // Hacky manual social accounts upsert for MVP
                    if (data.socials) {
                        await tx.influencerSocialAccount.deleteMany({
                            where: { influencerId: profile.id }
                        });
                        for (const s of data.socials) {
                            await tx.influencerSocialAccount.create({
                                data: {
                                    influencerId: profile.id,
                                    platform: s.platform,
                                    handle: s.handle,
                                    followersCount: s.followersCount,
                                    avgViews30d: s.avgViews30d,
                                    engagementRate: s.engagementRate,
                                    isVerified: false // Admin or system (Phyllo) confirms in the future
                                }
                            });
                        }
                    }
                    return p;
                });

                return reply.send(updated);

            } else if (user.role === 'COMPANY') {
                const data = updateCompanySchema.parse(request.body);

                const profile = await fastify.prisma.companyProfile.findUnique({ where: { userId: user.sub } });
                if (!profile) return reply.status(404).send({ error: 'Profile not found ' });

                const updated = await fastify.prisma.companyProfile.update({
                    where: { id: profile.id },
                    data
                });

                return reply.send(updated);
            } else {
                return reply.status(400).send({ error: 'Admin cannot update profile here' });
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.format() });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
