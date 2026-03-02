import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['COMPANY', 'INFLUENCER']),
    fullName: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {

    fastify.post('/auth/register', async (request, reply) => {
        try {
            const data = registerSchema.parse(request.body);

            const existingUser = await fastify.prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                return reply.status(400).send({ error: 'Email already registered' });
            }

            const passwordHash = await bcrypt.hash(data.password, 10);

            const user = await fastify.prisma.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: data.role,
                    fullName: data.fullName,
                    companyProfile: data.role === 'COMPANY' ? {
                        create: { companyName: data.fullName }
                    } : undefined,
                    influencerProfile: data.role === 'INFLUENCER' ? {
                        create: {}
                    } : undefined
                }
            });

            const token = fastify.jwt.sign({
                sub: user.id,
                role: user.role,
                email: user.email
            });

            return reply.status(201).send({
                user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
                token
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.format() });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.post('/auth/login', async (request, reply) => {
        try {
            const data = loginSchema.parse(request.body);

            const user = await fastify.prisma.user.findUnique({
                where: { email: data.email }
            });

            if (!user) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

            if (!isPasswordValid) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            if (user.status !== 'ACTIVE') {
                return reply.status(403).send({ error: 'Account is not active' });
            }

            const token = fastify.jwt.sign({
                sub: user.id,
                role: user.role,
                email: user.email
            });

            return reply.send({
                user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
                token
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.format() });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
