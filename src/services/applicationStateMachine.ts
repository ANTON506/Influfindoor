import { PrismaClient, ApplicationStatus } from '@prisma/client';

export class ApplicationStateMachine {
    constructor(private prisma: PrismaClient) { }

    // The 18 allowed states per the MVP requirements
    private static readonly ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
        APPLIED: ['PENDING_REVIEW', 'APPROVED_FOR_MOCK', 'AUTO_REJECTED', 'CANCELLED'],
        PENDING_REVIEW: ['APPROVED_FOR_MOCK', 'AUTO_REJECTED', 'CANCELLED'],
        AUTO_REJECTED: [],
        CANCELLED: [],

        // Mock phase
        APPROVED_FOR_MOCK: ['MOCK_SUBMITTED', 'CANCELLED'],
        MOCK_SUBMITTED: ['MOCK_APPROVED', 'MOCK_REJECTED', 'CANCELLED'],
        MOCK_REJECTED: ['MOCK_SUBMITTED', 'CANCELLED'],
        MOCK_APPROVED: ['AWAITING_PRODUCT', 'CANCELLED'],

        // Product Phase
        AWAITING_PRODUCT: ['PRODUCT_RECEIVED', 'CANCELLED'],
        PRODUCT_RECEIVED: ['FINAL_SUBMITTED', 'CANCELLED'],

        // Final Phase
        FINAL_SUBMITTED: ['FINAL_APPROVED', 'FINAL_REJECTED', 'CANCELLED'],
        FINAL_REJECTED: ['FINAL_SUBMITTED', 'CANCELLED'],
        FINAL_APPROVED: ['PENDING_PUBLICATION'],

        // Publishing Phase
        PENDING_PUBLICATION: ['PUBLISHED'],
        PUBLISHED: ['PAYMENT_RELEASED', 'DISPUTED'],

        // End states
        PAYMENT_RELEASED: [],
        DISPUTED: ['PAYMENT_RELEASED', 'REFUNDED'],
        REFUNDED: [],
        EXPIRED: []
    };

    async transition(
        applicationId: string,
        newState: ApplicationStatus,
        userId: string,
        reason?: string
    ) {
        // Transaction to ensure atomicity
        return this.prisma.$transaction(async (tx) => {
            const application = await tx.campaignApplication.findUnique({
                where: { id: applicationId }
            });

            if (!application) throw new Error('Application not found');

            const currentState = application.status;
            const allowedNextStates = ApplicationStateMachine.ALLOWED_TRANSITIONS[currentState];

            if (!allowedNextStates.includes(newState)) {
                throw new Error(`Invalid transition from ${currentState} to ${newState}`);
            }

            // 1. Update status
            const updated = await tx.campaignApplication.update({
                where: { id: applicationId },
                data: { status: newState }
            });

            // 2. Create Audit Log
            await tx.auditLog.create({
                data: {
                    entityId: applicationId,
                    entityType: 'Application',
                    actorId: userId,
                    actorType: 'USER',
                    action: `TRANSITION_TO_${newState}`,
                    newValue: { reason: reason || `Status updated from ${currentState} to ${newState}` }
                }
            });

            // 3. Handle specific side effects (e.g. Email notifications placeholder)
            await this.handleSideEffects(applicationId, newState, tx);

            return updated;
        });
    }

    private async handleSideEffects(applicationId: string, state: ApplicationStatus, tx: any) {
        // Placeholder for async side effects (sending emails via Resend, triggering BullMQ jobs)
        console.log(`[SideEffect] Application ${applicationId} entered state ${state}`);

        if (state === 'PUBLISHED') {
            // TODO: enqueue BullMQ job for 3-day auto-review timer
        }
    }
}
