import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Account } from '../accounts/account.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import {
  ReconciliationDiscrepancy,
} from '../reconciliation/reconciliation-discrepancy.entity.js';
import {
  ReconciliationRun,
} from '../reconciliation/reconciliation-run.entity.js';
import { RiskAssessment } from '../risk/risk-assessment.entity.js';
import {
  Transaction,
} from '../transactions/transaction.entity.js';
import { User } from '../users/user.entity.js';
import {
  WebhookDelivery,
} from '../webhooks/webhook-delivery.entity.js';
import {
  WebhookEndpoint,
} from '../webhooks/webhook-endpoint.entity.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,

    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,

    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,

    @InjectRepository(RiskAssessment)
    private readonly riskAssessmentsRepository: Repository<RiskAssessment>,

    @InjectRepository(ReconciliationRun)
    private readonly reconciliationRunsRepository: Repository<ReconciliationRun>,

    @InjectRepository(ReconciliationDiscrepancy)
    private readonly reconciliationDiscrepanciesRepository:
      Repository<ReconciliationDiscrepancy>,

    @InjectRepository(WebhookEndpoint)
    private readonly webhookEndpointsRepository:
      Repository<WebhookEndpoint>,

    @InjectRepository(WebhookDelivery)
    private readonly webhookDeliveriesRepository:
      Repository<WebhookDelivery>,
  ) {}

  private async requireOrganizationOwner(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: organizationId,
          ownerId: userId,
        },
      });

    if (!organization) {
      throw new ForbiddenException(
        'You do not have administrative access to this organization',
      );
    }

    return organization;
  }

  async getDashboard(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.requireOrganizationOwner(
        userId,
        organizationId,
      );

    const [
      users,
      accounts,
      payments,
      transactions,
      risks,
      reconciliationRuns,
      discrepancies,
      webhookEndpoints,
      webhookDeliveries,
    ] = await Promise.all([
      this.organizationsRepository
        .createQueryBuilder('organization')
        .leftJoin(User, 'user', 'user.id = organization.ownerId')
        .where('organization.id = :organizationId', {
          organizationId,
        })
        .getCount()
        .then(async () =>
          this.usersRepository.count({
            where: {
              id: organization.ownerId,
            },
          }),
        ),

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
        .innerJoin(
          WebhookEndpoint,
          'endpoint',
          'endpoint.id = delivery.endpointId',
        )
        .where(
          'endpoint.organizationId = :organizationId',
          { organizationId },
        )
        .getCount(),
    ]);

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        defaultCurrency:
          organization.defaultCurrency,
        isActive: organization.isActive,
      },
      counts: {
        users,
        accounts,
        payments,
        transactions,
        riskAssessments: risks,
        reconciliationRuns,
        unresolvedDiscrepancies:
          discrepancies,
        webhookEndpoints,
        webhookDeliveries,
      },
    };
  }

  async listUsers(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.requireOrganizationOwner(
        userId,
        organizationId,
      );

    const owner =
      await this.usersRepository.findOne({
        where: {
          id: organization.ownerId,
        },
      });

    if (!owner) {
      throw new NotFoundException(
        'Organization owner not found',
      );
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

  async listPayments(
    userId: string,
    organizationId: string,
  ) {
    await this.requireOrganizationOwner(
      userId,
      organizationId,
    );

    const payments =
      await this.paymentsRepository.find({
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

  async listTransactions(
    userId: string,
    organizationId: string,
  ) {
    await this.requireOrganizationOwner(
      userId,
      organizationId,
    );

    const transactions =
      await this.transactionsRepository.find({
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

  async listAccounts(
    userId: string,
    organizationId: string,
  ) {
    await this.requireOrganizationOwner(
      userId,
      organizationId,
    );

    const accounts =
      await this.accountsRepository.find({
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

  async listRiskAssessments(
    userId: string,
    organizationId: string,
  ) {
    await this.requireOrganizationOwner(
      userId,
      organizationId,
    );

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

  async listReconciliation(
    userId: string,
    organizationId: string,
  ) {
    await this.requireOrganizationOwner(
      userId,
      organizationId,
    );

    const [runs, discrepancies] =
      await Promise.all([
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

  async listWebhooks(
    userId: string,
    organizationId: string,
  ) {
    await this.requireOrganizationOwner(
      userId,
      organizationId,
    );

    const endpoints =
      await this.webhookEndpointsRepository.find({
        where: {
          organizationId,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    const endpointIds =
      endpoints.map((endpoint) => endpoint.id);

    const deliveries =
      endpointIds.length > 0
        ? await this.webhookDeliveriesRepository
            .createQueryBuilder('delivery')
            .where(
              'delivery.endpointId IN (:...endpointIds)',
              { endpointIds },
            )
            .orderBy(
              'delivery.createdAt',
              'DESC',
            )
            .take(100)
            .getMany()
        : [];

    return {
      endpoints: endpoints.map(
        (endpoint) => ({
          id: endpoint.id,
          organizationId: endpoint.organizationId,
          url: endpoint.url,
                    isActive: endpoint.isActive,
          createdAt: endpoint.createdAt,
          updatedAt: endpoint.updatedAt,
        }),
      ),
      deliveries,
    };
  }

  async setOrganizationStatus(
    userId: string,
    organizationId: string,
    isActive: boolean,
  ) {
    const organization =
      await this.requireOrganizationOwner(
        userId,
        organizationId,
      );

    organization.isActive = isActive;

    const saved =
      await this.organizationsRepository.save(
        organization,
      );

    return {
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      isActive: saved.isActive,
      updatedAt: saved.updatedAt,
    };
  }

  async setUserStatus(
    userId: string,
    organizationId: string,
    targetUserId: string,
    isActive: boolean,
  ) {
    const organization =
      await this.requireOrganizationOwner(
        userId,
        organizationId,
      );

    if (organization.ownerId !== targetUserId) {
      throw new ForbiddenException(
        'Administrative access to this user is not available',
      );
    }

    const user =
      await this.usersRepository.findOne({
        where: {
          id: targetUserId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    user.isActive = isActive;

    const saved =
      await this.usersRepository.save(user);

    return {
      id: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      isActive: saved.isActive,
      updatedAt: saved.updatedAt,
    };
  }
}

