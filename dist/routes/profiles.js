"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = profileRoutes;
const zod_1 = require("zod");
const updateInfluencerSchema = zod_1.z.object({
    bio: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    socials: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.enum(['TIKTOK', 'INSTAGRAM', 'BOTH']),
        handle: zod_1.z.string(),
        followersCount: zod_1.z.number().int().min(0),
        avgViews30d: zod_1.z.number().int().min(0),
        engagementRate: zod_1.z.number().min(0).max(100).optional(),
    })).optional()
});
const updateCompanySchema = zod_1.z.object({
    companyName: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
    website: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
async function profileRoutes(fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });
    // GET /profiles/me
    fastify.get('/profiles/me', async (request, reply) => {
        const user = request.user;
        try {
            if (user.role === 'INFLUENCER') {
                const profile = await fastify.prisma.influencerProfile.findUnique({
                    where: { userId: user.sub },
                    include: { socialAccounts: true }
                });
                return reply.send(profile);
            }
            else if (user.role === 'COMPANY') {
                const profile = await fastify.prisma.companyProfile.findUnique({
                    where: { userId: user.sub }
                });
                return reply.send(profile);
            }
            else {
                return reply.status(400).send({ error: 'Profile not mapped for Admin' });
            }
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    // PUT /profiles/me
    fastify.put('/profiles/me', async (request, reply) => {
        const user = request.user;
        try {
            if (user.role === 'INFLUENCER') {
                const data = updateInfluencerSchema.parse(request.body);
                // Find influencer ID
                const profile = await fastify.prisma.influencerProfile.findUnique({ where: { userId: user.sub } });
                if (!profile)
                    return reply.status(404).send({ error: 'Profile not found ' });
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
            }
            else if (user.role === 'COMPANY') {
                const data = updateCompanySchema.parse(request.body);
                const profile = await fastify.prisma.companyProfile.findUnique({ where: { userId: user.sub } });
                if (!profile)
                    return reply.status(404).send({ error: 'Profile not found ' });
                const updated = await fastify.prisma.companyProfile.update({
                    where: { id: profile.id },
                    data
                });
                return reply.send(updated);
            }
            else {
                return reply.status(400).send({ error: 'Admin cannot update profile here' });
            }
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.format() });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
//# sourceMappingURL=profiles.js.map