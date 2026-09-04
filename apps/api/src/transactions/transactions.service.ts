import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  Account,
  AccountType,
} from '../accounts/account.entity.js';

import {
  LedgerEntry,
  LedgerEntryType,
} from '../ledger/ledger-entry.entity.js';

import {
  Transaction,
  TransactionStatus,
} from './transaction.entity.js';

import { CreateTransactionDto } from './dto/create-transaction.dto.js';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,

    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,

    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const accountRepository =
          manager.getRepository(Account);

        const transactionRepository =
          manager.getRepository(Transaction);

        const ledgerRepository =
          manager.getRepository(LedgerEntry);

        if (
          dto.debitAccountId ===
          dto.creditAccountId
        ) {
          throw new ConflictException(
            'Debit and credit accounts must be different',
          );
        }

        const amount = BigInt(dto.amount);

        if (amount <= 0n) {
          throw new ConflictException(
            'Transaction amount must be greater than zero',
          );
        }

        /*
         * Lock both account rows before reading their balances.
         *
         * Always acquire locks in deterministic account-ID
         * order so two concurrent transactions touching the
         * same accounts do not acquire them in opposite orders.
         */
        const accountIds = [
          dto.debitAccountId,
          dto.creditAccountId,
        ].sort();

        const lockedAccounts =
          await accountRepository
            .createQueryBuilder('account')
            .innerJoinAndSelect(
              'account.organization',
              'organization',
            )
            .where(
              'account.id IN (:...accountIds)',
              {
                accountIds,
              },
            )
            .andWhere(
              'account.isActive = :isActive',
              {
                isActive: true,
              },
            )
            .orderBy(
              'account.id',
              'ASC',
            )
            .setLock(
              'pessimistic_write',
            )
            .getMany();

        if (
          lockedAccounts.length !== 2
        ) {
          const debitAccount =
            lockedAccounts.find(
              (account) =>
                account.id ===
                dto.debitAccountId,
            );

          if (!debitAccount) {
            throw new NotFoundException(
              'Debit account not found',
            );
          }

          throw new NotFoundException(
            'Credit account not found',
          );
        }

        const debitAccount =
          lockedAccounts.find(
            (account) =>
              account.id ===
              dto.debitAccountId,
          );

        const creditAccount =
          lockedAccounts.find(
            (account) =>
              account.id ===
              dto.creditAccountId,
          );

        if (
          !debitAccount ||
          !creditAccount
        ) {
          throw new NotFoundException(
            'Transaction accounts not found',
          );
        }

        if (
          debitAccount.organization.ownerId !==
            userId ||
          !debitAccount.organization.isActive
        ) {
          throw new NotFoundException(
            'Debit account not found',
          );
        }

        if (
          creditAccount.organization.ownerId !==
            userId ||
          !creditAccount.organization.isActive
        ) {
          throw new NotFoundException(
            'Credit account not found',
          );
        }

        if (
          debitAccount.organizationId !==
            dto.organizationId ||
          creditAccount.organizationId !==
            dto.organizationId
        ) {
          throw new ConflictException(
            'Both accounts must belong to the selected organization',
          );
        }

        if (
          debitAccount.currency !==
            dto.currency ||
          creditAccount.currency !==
            dto.currency
        ) {
          throw new ConflictException(
            'Transaction currency must match both account currencies',
          );
        }

        const reference =
          this.generateReference();

        const transaction =
          transactionRepository.create({
            organizationId:
              dto.organizationId,

            reference,

            type: dto.type,

            status:
              TransactionStatus.PROCESSING,

            amount:
              amount.toString(),

            currency:
              dto.currency,

            description:
              dto.description?.trim() ??
              null,

            metadata:
              dto.metadata ?? null,

            processedAt: null,
          });

        const savedTransaction =
          await transactionRepository.save(
            transaction,
          );

        const debitEntry =
          ledgerRepository.create({
            transactionId:
              savedTransaction.id,

            transaction:
              savedTransaction,

            accountId:
              debitAccount.id,

            account:
              debitAccount,

            type:
              LedgerEntryType.DEBIT,

            amount:
              amount.toString(),

            currency:
              dto.currency,

            description:
              dto.description?.trim() ??
              `Debit for ${reference}`,
          });

        const creditEntry =
          ledgerRepository.create({
            transactionId:
              savedTransaction.id,

            transaction:
              savedTransaction,

            accountId:
              creditAccount.id,

            account:
              creditAccount,

            type:
              LedgerEntryType.CREDIT,

            amount:
              amount.toString(),

            currency:
              dto.currency,

            description:
              dto.description?.trim() ??
              `Credit for ${reference}`,
          });

        const debitTotal =
          BigInt(
            debitEntry.amount,
          );

        const creditTotal =
          BigInt(
            creditEntry.amount,
          );

        if (
          debitTotal !==
          creditTotal
        ) {
          throw new ConflictException(
            'Transaction is not balanced',
          );
        }

        /*
         * IMPORTANT:
         * These balances are read only AFTER the
         * pessimistic row locks have been acquired.
         *
         * Therefore, if another transaction is already
         * changing either account, PostgreSQL makes this
         * transaction wait until that transaction commits
         * or rolls back.
         */
        const debitBalance =
          BigInt(
            debitAccount.balance,
          );

        const creditBalance =
          BigInt(
            creditAccount.balance,
          );

        const newDebitBalance =
          this.calculateBalance(
            debitAccount.type,
            LedgerEntryType.DEBIT,
            debitBalance,
            amount,
          );

        const newCreditBalance =
          this.calculateBalance(
            creditAccount.type,
            LedgerEntryType.CREDIT,
            creditBalance,
            amount,
          );

        if (
          newDebitBalance < 0n
        ) {
          throw new ConflictException(
            `Insufficient balance in debit account ${debitAccount.code}`,
          );
        }

        if (
          newCreditBalance < 0n
        ) {
          throw new ConflictException(
            `Insufficient balance in credit account ${creditAccount.code}`,
          );
        }

        await ledgerRepository.save([
          debitEntry,
          creditEntry,
        ]);

        debitAccount.balance =
          newDebitBalance.toString();

        creditAccount.balance =
          newCreditBalance.toString();

        await accountRepository.save([
          debitAccount,
          creditAccount,
        ]);

        savedTransaction.status =
          TransactionStatus.COMPLETED;

        savedTransaction.processedAt =
          new Date();

        await transactionRepository.save(
          savedTransaction,
        );

        return {
          transaction: {
            id:
              savedTransaction.id,

            organizationId:
              savedTransaction.organizationId,

            reference:
              savedTransaction.reference,

            type:
              savedTransaction.type,

            status:
              savedTransaction.status,

            amount:
              savedTransaction.amount,

            currency:
              savedTransaction.currency,

            description:
              savedTransaction.description,

            processedAt:
              savedTransaction.processedAt,

            createdAt:
              savedTransaction.createdAt,
          },

          ledger: {
            debit: {
              accountId:
                debitAccount.id,

              accountCode:
                debitAccount.code,

              accountType:
                debitAccount.type,

              amount:
                amount.toString(),

              currency:
                dto.currency,

              balanceAfter:
                debitAccount.balance,
            },

            credit: {
              accountId:
                creditAccount.id,

              accountCode:
                creditAccount.code,

              accountType:
                creditAccount.type,

              amount:
                amount.toString(),

              currency:
                dto.currency,

              balanceAfter:
                creditAccount.balance,
            },

            balanced: true,
          },
        };
      },
    );
  }

  async findAllForUser(
    userId: string,
    organizationId: string,
  ) {
    const account =
      await this.accountsRepository.findOne({
        where: {
          organizationId,
        },

        relations: {
          organization: true,
        },
      });

    if (
      !account ||
      account.organization.ownerId !==
        userId ||
      !account.organization.isActive
    ) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    return this.transactionsRepository.find({
      where: {
        organizationId,
      },

      relations: {
        ledgerEntries: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOneForUser(
    userId: string,
    transactionId: string,
  ) {
    const transaction =
      await this.transactionsRepository.findOne({
        where: {
          id: transactionId,
        },

        relations: {
          ledgerEntries: true,
        },
      });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction not found',
      );
    }

    const account =
      await this.accountsRepository.findOne({
        where: {
          organizationId:
            transaction.organizationId,
        },

        relations: {
          organization: true,
        },
      });

    if (
      !account ||
      account.organization.ownerId !==
        userId ||
      !account.organization.isActive
    ) {
      throw new NotFoundException(
        'Transaction not found',
      );
    }

    return transaction;
  }

  private calculateBalance(
    accountType: AccountType,
    entryType: LedgerEntryType,
    currentBalance: bigint,
    amount: bigint,
  ): bigint {
    const increasesOnDebit =
      accountType ===
        AccountType.ASSET ||
      accountType ===
        AccountType.EXPENSE;

    const increases =
      increasesOnDebit
        ? entryType ===
          LedgerEntryType.DEBIT
        : entryType ===
          LedgerEntryType.CREDIT;

    return increases
      ? currentBalance + amount
      : currentBalance - amount;
  }

  private generateReference(): string {
    const timestamp =
      Date.now().toString(36);

    const random =
      Math.random()
        .toString(36)
        .slice(2, 10);

    return `TXN-${timestamp}-${random}`.toUpperCase();
  }
}
