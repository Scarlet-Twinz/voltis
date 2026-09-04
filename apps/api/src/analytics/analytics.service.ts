import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Account } from '../accounts/account.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../payments/payment.entity.js';
import {
  ReconciliationRun,
} from '../reconciliation/reconciliation-run.entity.js';
import {
  RiskAssessment,
  RiskDecision,
} from '../risk/risk-assessment.entity.js';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/transaction.entity.js';
import {
  LedgerEntry,
  LedgerEntryType,
} from '../ledger/ledger-entry.entity.js';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,

    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,

    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,

    @InjectRepository(LedgerEntry)
    private readonly ledgerEntriesRepository: Repository<LedgerEntry>,

    @InjectRepository(RiskAssessment)
    private readonly riskAssessmentsRepository: Repository<RiskAssessment>,

    @InjectRepository(ReconciliationRun)
    private readonly reconciliationRunsRepository: Repository<ReconciliationRun>,
  ) {}

  private async getOrganization(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    return organization;
  }

  async getOverview(
    userId: string,
    organizationId: string,
  ) {
    const organization = await this.getOrganization(
      userId,
      organizationId,
    );

    const [
      paymentTotals,
      transactionTotals,
      accountTotals,
      riskTotals,
      reconciliationTotals,
      ledgerTotals,
    ] = await Promise.all([
      this.paymentsRepository
        .createQueryBuilder('payment')
        .select('COUNT(*)', 'count')
        .addSelect(
          'COALESCE(SUM(CAST(payment.amount AS NUMERIC)), 0)',
          'volume',
        )
        .where(
          'payment.organizationId = :organizationId',
          { organizationId },
        )
        .getRawOne(),

      this.transactionsRepository
        .createQueryBuilder('transaction')
        .select('COUNT(*)', 'count')
        .addSelect(
          'COALESCE(SUM(CAST(transaction.amount AS NUMERIC)), 0)',
          'volume',
        )
        .where(
          'transaction.organizationId = :organizationId',
          { organizationId },
        )
        .getRawOne(),

      this.accountsRepository
        .createQueryBuilder('account')
        .select('COUNT(*)', 'count')
        .addSelect(
          'COALESCE(SUM(CAST(account.balance AS NUMERIC)), 0)',
          'balance',
        )
        .where(
          'account.organizationId = :organizationId',
          { organizationId },
        )
        .andWhere('account.isActive = true')
        .getRawOne(),

      this.riskAssessmentsRepository
        .createQueryBuilder('risk')
        .select('COUNT(*)', 'count')
        .addSelect(
          `SUM(CASE WHEN risk.decision = :allow THEN 1 ELSE 0 END)`,
          'allowed',
        )
        .addSelect(
          `SUM(CASE WHEN risk.decision = :review THEN 1 ELSE 0 END)`,
          'review',
        )
        .addSelect(
          `SUM(CASE WHEN risk.decision = :block THEN 1 ELSE 0 END)`,
          'blocked',
        )
        .addSelect(
          'COALESCE(AVG(risk.score), 0)',
          'averageScore',
        )
        .where(
          'risk.organizationId = :organizationId',
          { organizationId },
        )
        .setParameters({
          allow: RiskDecision.ALLOW,
          review: RiskDecision.REVIEW,
          block: RiskDecision.BLOCK,
        })
        .getRawOne(),

      this.reconciliationRunsRepository
        .createQueryBuilder('run')
        .select('COUNT(*)', 'count')
        .addSelect(
          `SUM(CASE WHEN run.status = 'completed' THEN 1 ELSE 0 END)`,
          'completed',
        )
        .where(
          'run.organizationId = :organizationId',
          { organizationId },
        )
        .getRawOne(),

      this.ledgerEntriesRepository
        .createQueryBuilder('entry')
        .innerJoin(
          Transaction,
          'transaction',
          'transaction.id = entry.transactionId',
        )
        .select(
          `COALESCE(SUM(
            CASE
              WHEN entry.type = :debit
              THEN CAST(entry.amount AS NUMERIC)
              ELSE 0
            END
          ), 0)`,
          'debits',
        )
        .addSelect(
          `COALESCE(SUM(
            CASE
              WHEN entry.type = :credit
              THEN CAST(entry.amount AS NUMERIC)
              ELSE 0
            END
          ), 0)`,
          'credits',
        )
        .where(
          'transaction.organizationId = :organizationId',
          { organizationId },
        )
        .setParameter(
          'debit',
          LedgerEntryType.DEBIT,
        )
        .setParameter(
          'credit',
          LedgerEntryType.CREDIT,
        )
        .getRawOne(),
    ]);

    const [
      completedPayments,
      failedPayments,
      pendingPayments,
      processingPayments,
      completedTransactions,
      failedTransactions,
    ] = await Promise.all([
      this.paymentsRepository.count({
        where: {
          organizationId,
          status: PaymentStatus.COMPLETED,
        },
      }),

      this.paymentsRepository.count({
        where: {
          organizationId,
          status: PaymentStatus.FAILED,
        },
      }),

      this.paymentsRepository.count({
        where: {
          organizationId,
          status: PaymentStatus.PENDING,
        },
      }),

      this.paymentsRepository.count({
        where: {
          organizationId,
          status: PaymentStatus.PROCESSING,
        },
      }),

      this.transactionsRepository.count({
        where: {
          organizationId,
          status: TransactionStatus.COMPLETED,
        },
      }),

      this.transactionsRepository.count({
        where: {
          organizationId,
          status: TransactionStatus.FAILED,
        },
      }),
    ]);

    const paymentCount = Number(paymentTotals?.count ?? 0);
    const successfulPaymentCount = completedPayments;

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        defaultCurrency: organization.defaultCurrency,
      },

      payments: {
        total: paymentCount,
        volume: String(paymentTotals?.volume ?? '0'),
        completed: completedPayments,
        failed: failedPayments,
        pending: pendingPayments,
        processing: processingPayments,
        successRate:
          paymentCount > 0
            ? Number(
                (
                  (successfulPaymentCount / paymentCount) *
                  100
                ).toFixed(2),
              )
            : 0,
      },

      transactions: {
        total: Number(transactionTotals?.count ?? 0),
        volume: String(transactionTotals?.volume ?? '0'),
        completed: completedTransactions,
        failed: failedTransactions,
      },

      accounts: {
        total: Number(accountTotals?.count ?? 0),
        balance: String(accountTotals?.balance ?? '0'),
      },

      ledger: {
        debits: String(ledgerTotals?.debits ?? '0'),
        credits: String(ledgerTotals?.credits ?? '0'),
        balanced:
          String(ledgerTotals?.debits ?? '0') ===
          String(ledgerTotals?.credits ?? '0'),
      },

      risk: {
        total: Number(riskTotals?.count ?? 0),
        allowed: Number(riskTotals?.allowed ?? 0),
        review: Number(riskTotals?.review ?? 0),
        blocked: Number(riskTotals?.blocked ?? 0),
        averageScore: Number(
          Number(riskTotals?.averageScore ?? 0).toFixed(2),
        ),
      },

      reconciliation: {
        total: Number(
          reconciliationTotals?.count ?? 0,
        ),
        completed: Number(
          reconciliationTotals?.completed ?? 0,
        ),
      },
    };
  }

  async getPayments(
    userId: string,
    organizationId: string,
  ) {
    await this.getOrganization(
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

    const byStatus = Object.values(
      PaymentStatus,
    ).reduce(
      (result, status) => {
        result[status] = payments.filter(
          (payment) => payment.status === status,
        ).length;

        return result;
      },
      {} as Record<string, number>,
    );

    const byMethod = Object.values(
      PaymentMethod,
    ).reduce(
      (result, method) => {
        result[method] = payments.filter(
          (payment) => payment.method === method,
        ).length;

        return result;
      },
      {} as Record<string, number>,
    );

    const volumeByCurrency =
      payments.reduce(
        (result, payment) => {
          result[payment.currency] =
            (result[payment.currency] ?? 0) +
            Number(payment.amount);

          return result;
        },
        {} as Record<string, number>,
      );

    return {
      total: payments.length,
      byStatus,
      byMethod,
      volumeByCurrency,
      recent: payments.map((payment) => ({
        id: payment.id,
        reference: payment.reference,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
      })),
    };
  }

  async getTransactions(
    userId: string,
    organizationId: string,
  ) {
    await this.getOrganization(
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

    const byStatus = Object.values(
      TransactionStatus,
    ).reduce(
      (result, status) => {
        result[status] = transactions.filter(
          (transaction) =>
            transaction.status === status,
        ).length;

        return result;
      },
      {} as Record<string, number>,
    );

    const byType = Object.values(
      TransactionType,
    ).reduce(
      (result, type) => {
        result[type] = transactions.filter(
          (transaction) =>
            transaction.type === type,
        ).length;

        return result;
      },
      {} as Record<string, number>,
    );

    const volumeByCurrency =
      transactions.reduce(
        (result, transaction) => {
          result[transaction.currency] =
            (result[transaction.currency] ?? 0) +
            Number(transaction.amount);

          return result;
        },
        {} as Record<string, number>,
      );

    return {
      total: transactions.length,
      byStatus,
      byType,
      volumeByCurrency,
      recent: transactions.map(
        (transaction) => ({
          id: transaction.id,
          reference: transaction.reference,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          processedAt: transaction.processedAt,
          createdAt: transaction.createdAt,
        }),
      ),
    };
  }

  async getRisk(
    userId: string,
    organizationId: string,
  ) {
    await this.getOrganization(
      userId,
      organizationId,
    );

    const assessments =
      await this.riskAssessmentsRepository.find({
        where: {
          organizationId,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 100,
      });

    const byDecision = Object.values(
      RiskDecision,
    ).reduce(
      (result, decision) => {
        result[decision] =
          assessments.filter(
            (assessment) =>
              assessment.decision === decision,
          ).length;

        return result;
      },
      {} as Record<string, number>,
    );

    const averageScore =
      assessments.length > 0
        ? assessments.reduce(
            (total, assessment) =>
              total + assessment.score,
            0,
          ) / assessments.length
        : 0;

    return {
      total: assessments.length,
      averageScore: Number(
        averageScore.toFixed(2),
      ),
      byDecision,
      recent: assessments.map(
        (assessment) => ({
          id: assessment.id,
          paymentId: assessment.paymentId,
          score: assessment.score,
          decision: assessment.decision,
          signals: assessment.signals,
          explanation: assessment.explanation,
          createdAt: assessment.createdAt,
        }),
      ),
    };
  }

  async getAccounts(
    userId: string,
    organizationId: string,
  ) {
    await this.getOrganization(
      userId,
      organizationId,
    );

    const accounts =
      await this.accountsRepository.find({
        where: {
          organizationId,
          isActive: true,
        },
        order: {
          code: 'ASC',
        },
      });

    return {
      total: accounts.length,
      accounts: accounts.map(
        (account) => ({
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          currency: account.currency,
          balance: account.balance,
          isActive: account.isActive,
        }),
      ),
    };
  }
}
