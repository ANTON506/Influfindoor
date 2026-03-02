"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const fastify_1 = require("fastify");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['COMPANY', 'INFLUENCER']),
    fullName: zod_1.z.string().min(2),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
async function authRoutes(fastify) {
    fastify.post('/auth/register', async (request, reply) => {
        try {
            const data = registerSchema.parse(request.body);
            const existingUser = await fastify.prisma.user.findUnique({
                where: { email: data.email }
            });
            if (existingUser) {
                return reply.status(400).send({ error: 'Email already registered' });
            }
            const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            const user = await fastify.prisma.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: data.role,
                    fullName: data.fullName,
                    // Create the associated profile based on role
                    companyProfile: data.role === 'COMPANY' ? {
                        create: { companyName: data.fullName } // Minimum required field, can be updated later
                    } : undefined,
                    influencerProfile: data.role === 'INFLUENCER' ? {
                        create: {} // Empty profile to be filled later
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.errors });
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
            const isPasswordValid = await bcryptjs_1.default.compare(data.password, user.passwordHash);
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
//# sourceMappingURL=auth.js.map