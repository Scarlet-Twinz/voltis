import type { Request } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
interface ProcessPaymentBody {
    paymentId: string;
    organizationId: string;
    attempt?: number;
    maxAttempts?: number;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(request: AuthenticatedRequest, dto: CreatePaymentDto): Promise<{
        payment: import("./payment.entity.js").Payment;
        transaction: import("../transactions/transaction.entity.js").Transaction | null;
        idempotent: boolean;
        queued?: undefined;
        blocked?: undefined;
        risk?: undefined;
        reviewRequired?: undefined;
    } | {
        payment: import("./payment.entity.js").Payment;
        transaction: null;
        queued: boolean;
        blocked: boolean;
        risk: {
            score: number;
            decision: import("../risk/risk-assessment.entity.js").RiskDecision.BLOCK;
            explanation?: undefined;
        };
        idempotent: boolean;
        reviewRequired?: undefined;
    } | {
        payment: import("./payment.entity.js").Payment;
        transaction: null;
        queued: boolean;
        reviewRequired: boolean;
        risk: {
            score: number;
            decision: import("../risk/risk-assessment.entity.js").RiskDecision.REVIEW;
            explanation: string | null;
        };
        idempotent: boolean;
        blocked?: undefined;
    } | {
        payment: import("./payment.entity.js").Payment;
        transaction: null;
        queued: boolean;
        risk: {
            score: number;
            decision: import("../risk/risk-assessment.entity.js").RiskDecision.ALLOW;
            explanation?: undefined;
        };
        idempotent: boolean;
        blocked?: undefined;
        reviewRequired?: undefined;
    }>;
    processInternal(workerSecret: string | undefined, body: ProcessPaymentBody): Promise<{
        payment: import("./payment.entity.js").Payment;
        transaction: import("../transactions/transaction.entity.js").Transaction | null;
        alreadyProcessed: boolean;
    } | {
        payment: import("./payment.entity.js").Payment;
        transaction: {
            id: string;
            organizationId: string;
            reference: string;
            type: import("../transactions/transaction.entity.js").TransactionType;
            status: import("../transactions/transaction.entity.js").TransactionStatus.COMPLETED;
            amount: string;
            currency: string;
            description: string | null;
            processedAt: Date;
            createdAt: Date;
        };
        alreadyProcessed: boolean;
    }>;
    findAll(request: AuthenticatedRequest, organizationId: string): Promise<import("./payment.entity.js").Payment[]>;
    findOne(request: AuthenticatedRequest, paymentId: string): Promise<import("./payment.entity.js").Payment>;
}
export {};
