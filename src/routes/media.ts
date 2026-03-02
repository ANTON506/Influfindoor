import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

export default async function mediaRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // GET /media/upload-url
    // For MVP, we'll mock an S3 presigned URL generation
    fastify.get('/media/upload-url', async (request, reply) => {
        const user = request.user as { sub: string; role: string };

        // In production:
        // const s3Client = new S3Client({ region, credentials });
        // const command = new PutObjectCommand({ Bucket, Key });
        // const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        const fileId = randomUUID();
        const mockUploadUrl = `https://influfindoor-mock-bucket.s3.amazonaws.com/uploads/${user.sub}/${fileId}.mp4?AWSAccessKeyId=MOCK&Signature=MOCK&Expires=1700000000`;

        const mockFinalUrl = `https://influfindoor-mock-bucket.s3.amazonaws.com/uploads/${user.sub}/${fileId}.mp4`;

        return reply.send({
            uploadUrl: mockUploadUrl,
            finalUrl: mockFinalUrl, // The URL to save in the DB after client uploads
            fileId
        });
    });
}
