import { Request } from 'express';
import { AnalyticsService } from './analytics.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOverview(request: AuthenticatedRequest, organizationId: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
            defaultCurrency: string;
        };
        payments: {
            total: number;
            volume: string;
            completed: number;
            failed: number;
            pending: number;
            processing: number;
            successRate: number;
        };
        transactions: {
            total: number;
            volume: string;
            completed: number;
            failed: number;
        };
        accounts: {
            total: number;
            balance: string;
        };
        ledger: {
            debits: string;
            credits: string;
            balanced: boolean;
        };
        risk: {
            total: number;
            allowed: number;
            review: number;
            blocked: number;
            averageScore: number;
        };
        reconciliation: {
            total: number;
            completed: number;
        };
    }>;
    getPayments(request: AuthenticatedRequest, organizationId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byMethod: Record<string, number>;
        volumeByCurrency: Record<string, number>;
        recent: {
            id: string;
            reference: string;
            status: import("../payments/payment.entity.js").PaymentStatus;
            method: import("../payments/payment.entity.js").PaymentMethod;
            amount: string;
            currency: string;
            transactionId: string | null;
            createdAt: Date;
            processedAt: Date | null;
        }[];
    }>;
    getTransactions(request: AuthenticatedRequest, organizationId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        volumeByCurrency: Record<string, number>;
        recent: {
            id: string;
            reference: string;
            type: import("../transactions/transaction.entity.js").TransactionType;
            status: import("../transactions/transaction.entity.js").TransactionStatus;
            amount: string;
            currency: string;
            description: string | null;
            processedAt: Date | null;
            createdAt: Date;
        }[];
    }>;
    getRisk(request: AuthenticatedRequest, organizationId: string): Promise<{
        total: number;
        averageScore: number;
        byDecision: Record<string, number>;
        recent: {
            id: string;
            paymentId: string;
            score: number;
            decision: import("../risk/risk-assessment.entity.js").RiskDecision;
            signals: Record<string, unknown>;
            explanation: string | null;
            createdAt: Date;
        }[];
    }>;
    getAccounts(request: AuthenticatedRequest, organizationId: string): Promise<{
        total: number;
        accounts: {
            id: string;
            code: string;
            name: string;
            type: import("../accounts/account.entity.js").AccountType;
            currency: string;
            balance: string;
            isActive: boolean;
        }[];
    }>;
}
export {};
