import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import prismaPlugin from './plugins/prisma';

dotenv.config();

const server = Fastify({ logger: true });

// Register Plugins
server.register(prismaPlugin);

server.register(cors, {
    origin: '*', // Adjust for production
});

server.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-prod'
});

// Register Routes
server.register(import('./routes/auth'));
server.register(import('./routes/campaigns'));
server.register(import('./routes/applications'));
server.register(import('./routes/profiles'));
server.register(import('./routes/media'));

// Swagger for API Documentation
server.register(swagger, {
    openapi: {
        info: {
            title: 'Influfindoor API',
            description: 'API for the Influfindoor MVP',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
});

server.register(swaggerUi, {
    routePrefix: '/docs',
});

// Basic Health Check Route
server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date() };
});

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
        server.log.info(`Server listening on port 3001`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
