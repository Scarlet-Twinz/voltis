import { Request } from 'express';
import { AdminService } from './admin.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(request: AuthenticatedRequest, organizationId: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
            defaultCurrency: string;
            isActive: boolean;
        };
        counts: {
            users: number;
            accounts: number;
            payments: number;
            transactions: number;
            riskAssessments: number;
            reconciliationRuns: number;
            unresolvedDiscrepancies: number;
            webhookEndpoints: number;
            webhookDeliveries: number;
        };
    }>;
    listUsers(request: AuthenticatedRequest, organizationId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    listPayments(request: AuthenticatedRequest, organizationId: string): Promise<{
        id: string;
        reference: string;
        status: import("../payments/payment.entity.js").PaymentStatus;
        method: import("../payments/payment.entity.js").PaymentMethod;
        amount: string;
        currency: string;
        transactionId: string | null;
        failureReason: string | null;
        createdAt: Date;
        updatedAt: Date;
        processedAt: Date | null;
    }[]>;
    listTransactions(request: AuthenticatedRequest, organizationId: string): Promise<import("../transactions/transaction.entity.js").Transaction[]>;
    listAccounts(request: AuthenticatedRequest, organizationId: string): Promise<{
        id: string;
        code: string;
        name: string;
        type: import("../accounts/account.entity.js").AccountType;
        currency: string;
        balance: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    listRiskAssessments(request: AuthenticatedRequest, organizationId: string): Promise<import("../risk/risk-assessment.entity.js").RiskAssessment[]>;
    listReconciliation(request: AuthenticatedRequest, organizationId: string): Promise<{
        runs: import("../reconciliation/reconciliation-run.entity.js").ReconciliationRun[];
        discrepancies: import("../reconciliation/reconciliation-discrepancy.entity.js").ReconciliationDiscrepancy[];
    }>;
    listWebhooks(request: AuthenticatedRequest, organizationId: string): Promise<{
        endpoints: {
            id: string;
            organizationId: string;
            url: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        deliveries: import("../webhooks/webhook-delivery.entity.js").WebhookDelivery[];
    }>;
    setOrganizationStatus(request: AuthenticatedRequest, organizationId: string, body: {
        isActive: boolean;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    setUserStatus(request: AuthenticatedRequest, organizationId: string, targetUserId: string, body: {
        isActive: boolean;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
}
export {};
