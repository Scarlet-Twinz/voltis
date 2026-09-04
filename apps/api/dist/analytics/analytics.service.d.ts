import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment, PaymentMethod, PaymentStatus } from '../payments/payment.entity.js';
import { ReconciliationRun } from '../reconciliation/reconciliation-run.entity.js';
import { RiskAssessment, RiskDecision } from '../risk/risk-assessment.entity.js';
import { Transaction, TransactionStatus, TransactionType } from '../transactions/transaction.entity.js';
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
export declare class AnalyticsService {
    private readonly organizationsRepository;
    private readonly accountsRepository;
    private readonly paymentsRepository;
    private readonly transactionsRepository;
    private readonly ledgerEntriesRepository;
    private readonly riskAssessmentsRepository;
    private readonly reconciliationRunsRepository;
    constructor(organizationsRepository: Repository<Organization>, accountsRepository: Repository<Account>, paymentsRepository: Repository<Payment>, transactionsRepository: Repository<Transaction>, ledgerEntriesRepository: Repository<LedgerEntry>, riskAssessmentsRepository: Repository<RiskAssessment>, reconciliationRunsRepository: Repository<ReconciliationRun>);
    private getOrganization;
    getOverview(userId: string, organizationId: string): Promise<{
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
    getPayments(userId: string, organizationId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byMethod: Record<string, number>;
        volumeByCurrency: Record<string, number>;
        recent: {
            id: string;
            reference: string;
            status: PaymentStatus;
            method: PaymentMethod;
            amount: string;
            currency: string;
            transactionId: string | null;
            createdAt: Date;
            processedAt: Date | null;
        }[];
    }>;
    getTransactions(userId: string, organizationId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        volumeByCurrency: Record<string, number>;
        recent: {
            id: string;
            reference: string;
            type: TransactionType;
            status: TransactionStatus;
            amount: string;
            currency: string;
            description: string | null;
            processedAt: Date | null;
            createdAt: Date;
        }[];
    }>;
    getRisk(userId: string, organizationId: string): Promise<{
        total: number;
        averageScore: number;
        byDecision: Record<string, number>;
        recent: {
            id: string;
            paymentId: string;
            score: number;
            decision: RiskDecision;
            signals: Record<string, unknown>;
            explanation: string | null;
            createdAt: Date;
        }[];
    }>;
    getAccounts(userId: string, organizationId: string): Promise<{
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
