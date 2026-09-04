import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
} from 'typeorm';

import { Organization } from '../organizations/organization.entity.js';
import {
  Payment,
  PaymentStatus,
} from '../payments/payment.entity.js';
import {
  LedgerEntry,
  LedgerEntryType,
} from '../ledger/ledger-entry.entity.js';
import {
  Transaction,
  TransactionStatus,
} from '../transactions/transaction.entity.js';

import {
  ReconciliationDiscrepancy,
  ReconciliationDiscrepancyType,
} from './reconciliation-discrepancy.entity.js';
import {
  ReconciliationRun,
  ReconciliationStatus,
} from './reconciliation-run.entity.js';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(ReconciliationRun)
    private readonly runsRepository:
      Repository<ReconciliationRun>,

    @InjectRepository(ReconciliationDiscrepancy)
    private readonly discrepanciesRepository:
      Repository<ReconciliationDiscrepancy>,

    @InjectRepository(Payment)
    private readonly paymentsRepository:
      Repository<Payment>,

    @InjectRepository(Transaction)
    private readonly transactionsRepository:
      Repository<Transaction>,

    @InjectRepository(LedgerEntry)
    private readonly ledgerEntriesRepository:
      Repository<LedgerEntry>,

    @InjectRepository(Organization)
    private readonly organizationsRepository:
      Repository<Organization>,

    private readonly dataSource: DataSource,
  ) {}

  async reconcile(
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

    const run =
      this.runsRepository.create({
        organizationId,
        status:
          ReconciliationStatus.RUNNING,
        paymentsChecked: 0,
        transactionsChecked: 0,
        ledgerEntriesChecked: 0,
        matchedCount: 0,
        discrepancyCount: 0,
        failureReason: null,
        completedAt: null,
      });

    await this.runsRepository.save(run);

    try {
      const payments =
        await this.paymentsRepository.find({
          where: {
            organizationId,
          },
        });

      const transactions =
        await this.transactionsRepository.find({
          where: {
            organizationId,
          },
        });

      const transactionIds =
        transactions.map(
          (transaction) =>
            transaction.id,
        );

      const ledgerEntries =
        transactionIds.length > 0
          ? await this.ledgerEntriesRepository
              .createQueryBuilder('entry')
              .innerJoin(
                'entry.transaction',
                'transaction',
              )
              .where(
                'transaction.organizationId = :organizationId',
                { organizationId },
              )
              .getMany()
          : [];

      run.paymentsChecked =
        payments.length;

      run.transactionsChecked =
        transactions.length;

      run.ledgerEntriesChecked =
        ledgerEntries.length;

      const transactionMap =
        new Map(
          transactions.map(
            (transaction) => [
              transaction.id,
              transaction,
            ],
          ),
        );

      const entriesByTransaction =
        new Map<
          string,
          LedgerEntry[]
        >();

      for (const entry of ledgerEntries) {
        const entries =
          entriesByTransaction.get(
            entry.transactionId,
          ) ?? [];

        entries.push(entry);

        entriesByTransaction.set(
          entry.transactionId,
          entries,
        );
      }

      let matchedCount = 0;

      for (const payment of payments) {
        if (
          payment.status ===
          PaymentStatus.PENDING ||
          payment.status ===
          PaymentStatus.PROCESSING
        ) {
          continue;
        }

        if (!payment.transactionId) {
          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .MISSING_TRANSACTION,
              paymentId: payment.id,
              transactionId: null,
              message:
                'Completed or failed payment has no transaction reference',
              details: {
                paymentStatus:
                  payment.status,
                amount:
                  payment.amount,
                currency:
                  payment.currency,
              },
            },
          );

          continue;
        }

        const transaction =
          transactionMap.get(
            payment.transactionId,
          );

        if (!transaction) {
          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .TRANSACTION_NOT_FOUND,
              paymentId: payment.id,
              transactionId:
                payment.transactionId,
              message:
                'Payment references a transaction that does not exist',
              details: null,
            },
          );

          continue;
        }

        let paymentMatched = true;

        if (
          BigInt(payment.amount) !==
          BigInt(transaction.amount)
        ) {
          paymentMatched = false;

          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .AMOUNT_MISMATCH,
              paymentId: payment.id,
              transactionId:
                transaction.id,
              message:
                'Payment amount does not match transaction amount',
              details: {
                paymentAmount:
                  payment.amount,
                transactionAmount:
                  transaction.amount,
              },
            },
          );
        }

        if (
          payment.currency !==
          transaction.currency
        ) {
          paymentMatched = false;

          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .CURRENCY_MISMATCH,
              paymentId: payment.id,
              transactionId:
                transaction.id,
              message:
                'Payment currency does not match transaction currency',
              details: {
                paymentCurrency:
                  payment.currency,
                transactionCurrency:
                  transaction.currency,
              },
            },
          );
        }

        if (
          payment.status ===
            PaymentStatus.COMPLETED &&
          transaction.status !==
            TransactionStatus.COMPLETED
        ) {
          paymentMatched = false;

          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .STATUS_MISMATCH,
              paymentId: payment.id,
              transactionId:
                transaction.id,
              message:
                'Completed payment does not have a completed transaction',
              details: {
                paymentStatus:
                  payment.status,
                transactionStatus:
                  transaction.status,
              },
            },
          );
        }

        const entries =
          entriesByTransaction.get(
            transaction.id,
          ) ?? [];

        if (entries.length < 2) {
          paymentMatched = false;

          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .MISSING_LEDGER_ENTRIES,
              paymentId: payment.id,
              transactionId:
                transaction.id,
              message:
                'Transaction does not have the required double-entry ledger records',
              details: {
                entryCount:
                  entries.length,
              },
            },
          );
        }

        const debitTotal =
          entries
            .filter(
              (entry) =>
                entry.type ===
                LedgerEntryType.DEBIT,
            )
            .reduce(
              (sum, entry) =>
                sum +
                BigInt(entry.amount),
              0n,
            );

        const creditTotal =
          entries
            .filter(
              (entry) =>
                entry.type ===
                LedgerEntryType.CREDIT,
            )
            .reduce(
              (sum, entry) =>
                sum +
                BigInt(entry.amount),
              0n,
            );

        if (
          debitTotal !== creditTotal
        ) {
          paymentMatched = false;

          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .UNBALANCED_LEDGER,
              paymentId: payment.id,
              transactionId:
                transaction.id,
              message:
                'Ledger debit and credit totals do not balance',
              details: {
                debitTotal:
                  debitTotal.toString(),
                creditTotal:
                  creditTotal.toString(),
              },
            },
          );
        }

        if (
          debitTotal !==
          BigInt(transaction.amount) ||
          creditTotal !==
          BigInt(transaction.amount)
        ) {
          paymentMatched = false;

          await this.recordDiscrepancy(
            run,
            {
              organizationId,
              type:
                ReconciliationDiscrepancyType
                  .TRANSACTION_LEDGER_AMOUNT_MISMATCH,
              paymentId: payment.id,
              transactionId:
                transaction.id,
              message:
                'Ledger total does not match transaction amount',
              details: {
                transactionAmount:
                  transaction.amount,
                debitTotal:
                  debitTotal.toString(),
                creditTotal:
                  creditTotal.toString(),
              },
            },
          );
        }

        if (paymentMatched) {
          matchedCount += 1;
        }
      }

      run.matchedCount =
        matchedCount;

      run.discrepancyCount =
        await this.discrepanciesRepository.count({
          where: {
            runId: run.id,
          },
        });

      run.status =
        ReconciliationStatus.COMPLETED;

      run.completedAt =
        new Date();

      await this.runsRepository.save(
        run,
      );

      return this.getRun(run.id);
    } catch (error) {
      run.status =
        ReconciliationStatus.FAILED;

      run.failureReason =
        error instanceof Error
          ? error.message
          : 'Reconciliation failed';

      run.completedAt =
        new Date();

      await this.runsRepository.save(
        run,
      );

      throw error;
    }
  }

  async getRun(
    runId: string,
  ) {
    return this.runsRepository.findOne({
      where: {
        id: runId,
      },
      relations: {
        discrepancies: true,
      },
    });
  }

  async findRunsForUser(
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

    return this.runsRepository.find({
      where: {
        organizationId,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: {
        discrepancies: true,
      },
    });
  }

  private async recordDiscrepancy(
    run: ReconciliationRun,
    data: {
      organizationId: string;
      type: ReconciliationDiscrepancyType;
      paymentId: string | null;
      transactionId: string | null;
      message: string;
      details: Record<string, unknown> | null;
    },
  ) {
    const discrepancy =
      this.discrepanciesRepository.create({
        runId: run.id,
        organizationId:
          data.organizationId,
        type: data.type,
        paymentId: data.paymentId,
        transactionId:
          data.transactionId,
        message: data.message,
        details: data.details,
        resolved: false,
      });

    await this.discrepanciesRepository.save(
      discrepancy,
    );
  }
}
