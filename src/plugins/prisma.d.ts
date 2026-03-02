import { PrismaClient } from '@prisma/client';
declare const _default: (fastify: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("node:http").IncomingMessage, import("node:http").ServerResponse<import("node:http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>, opts: Record<never, never>) => Promise<void>;
export default _default;
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}
//# sourceMappingURL=prisma.d.ts.map