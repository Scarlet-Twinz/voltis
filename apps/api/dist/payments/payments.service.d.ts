import { DataSource, Repository } from 'typeorm';
import { Account } from '../accounts/account.entity.js';
import { RealtimeService } from '../events/realtime.service.js';
import { Organization } from '../organizations/organization.entity.js';
import { RiskDecision } from '../risk/risk-assessment.entity.js';
import { RiskService } from '../risk/risk.service.js';
import { Transaction, TransactionStatus, TransactionType } from '../transactions/transaction.entity.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { Payment } from './payment.entity.js';
import { PaymentQueueService } from './queue/payment-queue.service.js';
export declare class PaymentsService {
    private readonly paymentsRepository;
    private readonly accountsRepository;
    private readonly organizationsRepository;
    private readonly transactionsRepository;
    private readonly transactionsService;
    private readonly paymentQueueService;
    private readonly riskService;
    private readonly realtimeService;
    private readonly dataSource;
    constructor(paymentsRepository: Repository<Payment>, accountsRepository: Repository<Account>, organizationsRepository: Repository<Organization>, transactionsRepository: Repository<Transaction>, transactionsService: TransactionsService, paymentQueueService: PaymentQueueService, riskService: RiskService, realtimeService: RealtimeService, dataSource: DataSource);
    create(userId: string, dto: CreatePaymentDto): Promise<{
        payment: Payment;
        transaction: Transaction | null;
        idempotent: boolean;
        queued?: undefined;
        blocked?: undefined;
        risk?: undefined;
        reviewRequired?: undefined;
    } | {
        payment: Payment;
        transaction: null;
        queued: boolean;
        blocked: boolean;
        risk: {
            score: number;
            decision: RiskDecision.BLOCK;
            explanation?: undefined;
        };
        idempotent: boolean;
        reviewRequired?: undefined;
    } | {
        payment: Payment;
        transaction: null;
        queued: boolean;
        reviewRequired: boolean;
        risk: {
            score: number;
            decision: RiskDecision.REVIEW;
            explanation: string | null;
        };
        idempotent: boolean;
        blocked?: undefined;
    } | {
        payment: Payment;
        transaction: null;
        queued: boolean;
        risk: {
            score: number;
            decision: RiskDecision.ALLOW;
            explanation?: undefined;
        };
        idempotent: boolean;
        blocked?: undefined;
        reviewRequired?: undefined;
    }>;
    processQueuedPayment(paymentId: string, organizationId: string, attempt?: number, maxAttempts?: number): Promise<{
        payment: Payment;
        transaction: Transaction | null;
        alreadyProcessed: boolean;
    } | {
        payment: Payment;
        transaction: {
            id: string;
            organizationId: string;
            reference: string;
            type: TransactionType;
            status: TransactionStatus.COMPLETED;
            amount: string;
            currency: string;
            description: string | null;
            processedAt: Date;
            createdAt: Date;
        };
        alreadyProcessed: boolean;
    }>;
    private failPaymentAttempt;
    private findTransactionForPayment;
    findAllForUser(userId: string, organizationId: string): Promise<Payment[]>;
    findOneForUser(userId: string, paymentId: string): Promise<Payment>;
    private createRequestFingerprint;
    private generateReference;
    private generateProcessorReference;
}
