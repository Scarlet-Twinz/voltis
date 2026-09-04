import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Account } from '../accounts/account.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import {
  LedgerEntry,
  LedgerEntryType,
} from './ledger-entry.entity.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,

    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,

    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,

    private readonly dataSource: DataSource,
  ) {}

  async createEntry(
    userId: string,
    dto: CreateLedgerEntryDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const transaction =
          await manager.getRepository(Transaction).findOne({
            where: {
              id: dto.transactionId,
            },
          });

        if (!transaction) {
          throw new NotFoundException(
            'Transaction not found',
          );
        }

        const account =
          await manager.getRepository(Account).findOne({
            where: {
              id: dto.accountId,
              isActive: true,
            },
            relations: {
              organization: true,
            },
          });

        if (!account) {
          throw new NotFoundException(
            'Account not found',
          );
        }

        if (
          account.organization.ownerId !== userId ||
          !account.organization.isActive
        ) {
          throw new NotFoundException(
            'Account not found',
          );
        }

        if (
          transaction.organizationId !==
          account.organizationId
        ) {
          throw new ConflictException(
            'Transaction and account must belong to the same organization',
          );
        }

        if (transaction.currency !== dto.currency) {
          throw new ConflictException(
            'Ledger entry currency must match the transaction currency',
          );
        }

        if (account.currency !== dto.currency) {
          throw new ConflictException(
            'Ledger entry currency must match the account currency',
          );
        }

        const amount = BigInt(dto.amount);

        if (amount <= 0n) {
          throw new ConflictException(
            'Ledger entry amount must be greater than zero',
          );
        }

        const ledgerEntry =
          manager.getRepository(LedgerEntry).create({
            transactionId: transaction.id,
            transaction,
            accountId: account.id,
            account,
            type: dto.type,
            amount: amount.toString(),
            currency: dto.currency,
            description: dto.description.trim(),
          });

        const savedEntry =
          await manager
            .getRepository(LedgerEntry)
            .save(ledgerEntry);

        const currentBalance = BigInt(
          account.balance,
        );

        const newBalance =
          dto.type === LedgerEntryType.DEBIT
            ? currentBalance + amount
            : currentBalance - amount;

        if (newBalance < 0n) {
          throw new ConflictException(
            'Account balance cannot become negative',
          );
        }

        account.balance = newBalance.toString();

        await manager
          .getRepository(Account)
          .save(account);

        return {
          id: savedEntry.id,
          transactionId: savedEntry.transactionId,
          accountId: savedEntry.accountId,
          type: savedEntry.type,
          amount: savedEntry.amount,
          currency: savedEntry.currency,
          description: savedEntry.description,
          createdAt: savedEntry.createdAt,
          balanceAfter: account.balance,
        };
      },
    );
  }

  async findByTransaction(
    userId: string,
    transactionId: string,
  ) {
    const transaction =
      await this.transactionsRepository.findOne({
        where: {
          id: transactionId,
        },
      });

    if (
      !transaction ||
      transaction.organizationId === undefined
    ) {
      throw new NotFoundException(
        'Transaction not found',
      );
    }

    const account =
      await this.accountsRepository.findOne({
        where: {
          organizationId: transaction.organizationId,
        },
        relations: {
          organization: true,
        },
      });

    if (
      !account ||
      account.organization.ownerId !== userId
    ) {
      throw new NotFoundException(
        'Transaction not found',
      );
    }

    return this.ledgerRepository.find({
      where: {
        transactionId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }
}
