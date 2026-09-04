var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { ReconciliationDiscrepancy, } from '../reconciliation/reconciliation-discrepancy.entity.js';
import { ReconciliationRun, } from '../reconciliation/reconciliation-run.entity.js';
import { RiskAssessment } from '../risk/risk-assessment.entity.js';
import { Transaction, } from '../transactions/transaction.entity.js';
import { User } from '../users/user.entity.js';
import { WebhookDelivery, } from '../webhooks/webhook-delivery.entity.js';
import { WebhookEndpoint, } from '../webhooks/webhook-endpoint.entity.js';
let AdminService = class AdminService {
    usersRepository;
    organizationsRepository;
    accountsRepository;
    paymentsRepository;
    transactionsRepository;
    riskAssessmentsRepository;
    reconciliationRunsRepository;
    reconciliationDiscrepanciesRepository;
    webhookEndpointsRepository;
    webhookDeliveriesRepository;
    constructor(usersRepository, organizationsRepository, accountsRepository, paymentsRepository, transactionsRepository, riskAssessmentsRepository, reconciliationRunsRepository, reconciliationDiscrepanciesRepository, webhookEndpointsRepository, webhookDeliveriesRepository) {
        this.usersRepository = usersRepository;
        this.organizationsRepository = organizationsRepository;
        this.accountsRepository = accountsRepository;
        this.paymentsRepository = paymentsRepository;
        this.transactionsRepository = transactionsRepository;
        this.riskAssessmentsRepository = riskAssessmentsRepository;
        this.reconciliationRunsRepository = reconciliationRunsRepository;
        this.reconciliationDiscrepanciesRepository = reconciliationDiscrepanciesRepository;
        this.webhookEndpointsRepository = webhookEndpointsRepository;
        this.webhookDeliveriesRepository = webhookDeliveriesRepository;
    }
    async requireOrganizationOwner(userId, organizationId) {
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: organizationId,
                ownerId: userId,
            },
        });
        if (!organization) {
            throw new ForbiddenException('You do not have administrative access to this organization');
        }
        return organization;
    }
    async getDashboard(userId, organizationId) {
        const organization = await this.requireOrganizationOwner(userId, organizationId);
        const [users, accounts, payments, transactions, risks, reconciliationRuns, discrepancies, webhookEndpoints, webhookDeliveries,] = await Promise.all([
            this.organizationsRepository
                .createQueryBuilder('organization')
                .leftJoin(User, 'user', 'user.id = organization.ownerId')
                .where('organization.id = :organizationId', {
                organizationId,
            })
                .getCount()
                .then(async () => this.usersRepository.count({
                where: {
                    id: organization.ownerId,
                },
            })),
            this.accountsRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.paymentsRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.transactionsRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.riskAssessmentsRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.reconciliationRunsRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.reconciliationDiscrepanciesRepository.count({
                where: {
                    organizationId,
                    resolved: false,
                },
            }),
            this.webhookEndpointsRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.webhookDeliveriesRepository
                .createQueryBuilder('delivery')
                .innerJoin(WebhookEndpoint, 'endpoint', 'endpoint.id = delivery.endpointId')
                .where('endpoint.organizationId = :organizationId', { organizationId })
                .getCount(),
        ]);
        return {
            organization: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                defaultCurrency: organization.defaultCurrency,
                isActive: organization.isActive,
            },
            counts: {
                users,
                accounts,
                payments,
                transactions,
                riskAssessments: risks,
                reconciliationRuns,
                unresolvedDiscrepancies: discrepancies,
                webhookEndpoints,
                webhookDeliveries,
            },
        };
    }
    async listUsers(userId, organizationId) {
        const organization = await this.requireOrganizationOwner(userId, organizationId);
        const owner = await this.usersRepository.findOne({
            where: {
                id: organization.ownerId,
            },
        });
        if (!owner) {
            throw new NotFoundException('Organization owner not found');
        }
        return [
            {
                id: owner.id,
                email: owner.email,
                firstName: owner.firstName,
                lastName: owner.lastName,
                isActive: owner.isActive,
                createdAt: owner.createdAt,
                updatedAt: owner.updatedAt,
            },
        ];
    }
    async listPayments(userId, organizationId) {
        await this.requireOrganizationOwner(userId, organizationId);
        const payments = await this.paymentsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
            take: 100,
        });
        return payments.map((payment) => ({
            id: payment.id,
            reference: payment.reference,
            status: payment.status,
            method: payment.method,
            amount: payment.amount,
            currency: payment.currency,
            transactionId: payment.transactionId,
            failureReason: payment.failureReason,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            processedAt: payment.processedAt,
        }));
    }
    async listTransactions(userId, organizationId) {
        await this.requireOrganizationOwner(userId, organizationId);
        const transactions = await this.transactionsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
            take: 100,
        });
        return transactions;
    }
    async listAccounts(userId, organizationId) {
        await this.requireOrganizationOwner(userId, organizationId);
        const accounts = await this.accountsRepository.find({
            where: {
                organizationId,
            },
            order: {
                code: 'ASC',
            },
        });
        return accounts.map((account) => ({
            id: account.id,
            code: account.code,
            name: account.name,
            type: account.type,
            currency: account.currency,
            balance: account.balance,
            isActive: account.isActive,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        }));
    }
    async listRiskAssessments(userId, organizationId) {
        await this.requireOrganizationOwner(userId, organizationId);
        return this.riskAssessmentsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
            take: 100,
        });
    }
    async listReconciliation(userId, organizationId) {
        await this.requireOrganizationOwner(userId, organizationId);
        const [runs, discrepancies] = await Promise.all([
            this.reconciliationRunsRepository.find({
                where: {
                    organizationId,
                },
                order: {
                    createdAt: 'DESC',
                },
                take: 100,
            }),
            this.reconciliationDiscrepanciesRepository.find({
                where: {
                    organizationId,
                },
                order: {
                    createdAt: 'DESC',
                },
                take: 100,
            }),
        ]);
        return {
            runs,
            discrepancies,
        };
    }
    async listWebhooks(userId, organizationId) {
        await this.requireOrganizationOwner(userId, organizationId);
        const endpoints = await this.webhookEndpointsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
        const endpointIds = endpoints.map((endpoint) => endpoint.id);
        const deliveries = endpointIds.length > 0
            ? await this.webhookDeliveriesRepository
                .createQueryBuilder('delivery')
                .where('delivery.endpointId IN (:...endpointIds)', { endpointIds })
                .orderBy('delivery.createdAt', 'DESC')
                .take(100)
                .getMany()
            : [];
        return {
            endpoints: endpoints.map((endpoint) => ({
                id: endpoint.id,
                organizationId: endpoint.organizationId,
                url: endpoint.url,
                isActive: endpoint.isActive,
                createdAt: endpoint.createdAt,
                updatedAt: endpoint.updatedAt,
            })),
            deliveries,
        };
    }
    async setOrganizationStatus(userId, organizationId, isActive) {
        const organization = await this.requireOrganizationOwner(userId, organizationId);
        organization.isActive = isActive;
        const saved = await this.organizationsRepository.save(organization);
        return {
            id: saved.id,
            name: saved.name,
            slug: saved.slug,
            isActive: saved.isActive,
            updatedAt: saved.updatedAt,
        };
    }
    async setUserStatus(userId, organizationId, targetUserId, isActive) {
        const organization = await this.requireOrganizationOwner(userId, organizationId);
        if (organization.ownerId !== targetUserId) {
            throw new ForbiddenException('Administrative access to this user is not available');
        }
        const user = await this.usersRepository.findOne({
            where: {
                id: targetUserId,
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.isActive = isActive;
        const saved = await this.usersRepository.save(user);
        return {
            id: saved.id,
            email: saved.email,
            firstName: saved.firstName,
            lastName: saved.lastName,
            isActive: saved.isActive,
            updatedAt: saved.updatedAt,
        };
    }
};
AdminService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectRepository(Organization)),
    __param(2, InjectRepository(Account)),
    __param(3, InjectRepository(Payment)),
    __param(4, InjectRepository(Transaction)),
    __param(5, InjectRepository(RiskAssessment)),
    __param(6, InjectRepository(ReconciliationRun)),
    __param(7, InjectRepository(ReconciliationDiscrepancy)),
    __param(8, InjectRepository(WebhookEndpoint)),
    __param(9, InjectRepository(WebhookDelivery)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository])
], AdminService);
export { AdminService };
//# sourceMappingURL=admin.service.js.map