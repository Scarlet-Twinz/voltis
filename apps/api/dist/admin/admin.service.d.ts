import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { ReconciliationDiscrepancy } from '../reconciliation/reconciliation-discrepancy.entity.js';
import { ReconciliationRun } from '../reconciliation/reconciliation-run.entity.js';
import { RiskAssessment } from '../risk/risk-assessment.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { User } from '../users/user.entity.js';
import { WebhookDelivery } from '../webhooks/webhook-delivery.entity.js';
import { WebhookEndpoint } from '../webhooks/webhook-endpoint.entity.js';
export declare class AdminService {
    private readonly usersRepository;
    private readonly organizationsRepository;
    private readonly accountsRepository;
    private readonly paymentsRepository;
    private readonly transactionsRepository;
    private readonly riskAssessmentsRepository;
    private readonly reconciliationRunsRepository;
    private readonly reconciliationDiscrepanciesRepository;
    private readonly webhookEndpointsRepository;
    private readonly webhookDeliveriesRepository;
    constructor(usersRepository: Repository<User>, organizationsRepository: Repository<Organization>, accountsRepository: Repository<Account>, paymentsRepository: Repository<Payment>, transactionsRepository: Repository<Transaction>, riskAssessmentsRepository: Repository<RiskAssessment>, reconciliationRunsRepository: Repository<ReconciliationRun>, reconciliationDiscrepanciesRepository: Repository<ReconciliationDiscrepancy>, webhookEndpointsRepository: Repository<WebhookEndpoint>, webhookDeliveriesRepository: Repository<WebhookDelivery>);
    private requireOrganizationOwner;
    getDashboard(userId: string, organizationId: string): Promise<{
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
    listUsers(userId: string, organizationId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    listPayments(userId: string, organizationId: string): Promise<{
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
    listTransactions(userId: string, organizationId: string): Promise<Transaction[]>;
    listAccounts(userId: string, organizationId: string): Promise<{
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
    listRiskAssessments(userId: string, organizationId: string): Promise<RiskAssessment[]>;
    listReconciliation(userId: string, organizationId: string): Promise<{
        runs: ReconciliationRun[];
        discrepancies: ReconciliationDiscrepancy[];
    }>;
    listWebhooks(userId: string, organizationId: string): Promise<{
        endpoints: {
            id: string;
            organizationId: string;
            url: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        deliveries: WebhookDelivery[];
    }>;
    setOrganizationStatus(userId: string, organizationId: string, isActive: boolean): Promise<{
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    setUserStatus(userId: string, organizationId: string, targetUserId: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
}
