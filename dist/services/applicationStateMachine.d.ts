import { PrismaClient, ApplicationStatus } from '@prisma/client';
export declare class ApplicationStateMachine {
    private prisma;
    constructor(prisma: PrismaClient);
    private static readonly ALLOWED_TRANSITIONS;
    transition(applicationId: string, newState: ApplicationStatus, userId: string, reason?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        campaignId: string;
        influencerId: string;
        followersSnapshot: import("@prisma/client/runtime/client").JsonValue;
        avgViewsSnapshot: import("@prisma/client/runtime/client").JsonValue;
        requirementsMet: boolean;
        requirementsNotes: string | null;
        rejectionReason: string | null;
        rejectedBy: string | null;
        disputeStatus: import(".prisma/client").$Enums.DisputeStatus;
        appliedAt: Date;
        approvedAt: Date | null;
        completedAt: Date | null;
    }>;
    private handleSideEffects;
}
