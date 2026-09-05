import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Account, AccountType } from '../accounts/account.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { LedgerEntry, LedgerEntryType } from './ledger-entry.entity.js';
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

    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,

    private readonly dataSource: DataSource,
  ) {}

  async createEntry(userId: string, dto: CreateLedgerEntryDto) {
    return this.dataSource.transaction(async (manager) => {
      const transactionRepository = manager.getRepository(Transaction);
      const accountRepository = manager.getRepository(Account);
      const ledgerRepository = manager.getRepository(LedgerEntry);
      const organizationRepository = manager.getRepository(Organization);

      const transaction = await transactionRepository.findOne({
        where: { id: dto.transactionId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      const organization = await organizationRepository.findOne({
        where: {
          id: transaction.organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

      if (!organization) {
        throw new NotFoundException('Transaction not found');
      }

      const amount = BigInt(dto.amount);
      if (amount <= 0n) {
        throw new ConflictException('Ledger entry amount must be greater than zero');
      }

      if (amount !== BigInt(transaction.amount)) {
        throw new ConflictException('Ledger entry amount must match the transaction amount');
      }

      const existingEntries = await ledgerRepository.find({
        where: { transactionId: transaction.id },
        order: { createdAt: 'ASC' },
      });

      if (existingEntries.length >= 2) {
        throw new ConflictException('Transaction already has a complete double-entry ledger');
      }

      const existingEntry = existingEntries[0];
      if (existingEntry && existingEntry.type === dto.type) {
        throw new ConflictException('A transaction must contain one debit and one credit entry');
      }

      if (
        existingEntry &&
        (existingEntry.amount !== amount.toString() ||
          existingEntry.currency !== dto.currency)
      ) {
        throw new ConflictException('Ledger entries must match the transaction amount and currency');
      }

      const account = await accountRepository
        .createQueryBuilder('account')
        .innerJoinAndSelect('account.organization', 'organization')
        .where('account.id = :accountId', { accountId: dto.accountId })
        .andWhere('account.isActive = :isActive', { isActive: true })
        .setLock('pessimistic_write')
        .getOne();

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      if (
        account.organization.ownerId !== userId ||
        !account.organization.isActive
      ) {
        throw new NotFoundException('Account not found');
      }

      if (transaction.organizationId !== account.organizationId) {
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

      const ledgerEntry = ledgerRepository.create({
        transactionId: transaction.id,
        transaction,
        accountId: account.id,
        account,
        type: dto.type,
        amount: amount.toString(),
        currency: dto.currency,
        description: dto.description.trim(),
      });

      const currentBalance = BigInt(account.balance);
      const newBalance = this.calculateBalance(
        account.type,
        dto.type,
        currentBalance,
        amount,
      );

      if (newBalance < 0n) {
        throw new ConflictException('Account balance cannot become negative');
      }

      const savedEntry = await ledgerRepository.save(ledgerEntry);

      account.balance = newBalance.toString();
      await accountRepository.save(account);

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
    });
  }

  async findByTransaction(userId: string, transactionId: string) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const organization = await this.organizationsRepository.findOne({
      where: {
        id: transaction.organizationId,
        ownerId: userId,
        isActive: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Transaction not found');
    }

    return this.ledgerRepository.find({
      where: { transactionId },
      order: { createdAt: 'ASC' },
    });
  }

  private calculateBalance(
    accountType: AccountType,
    entryType: LedgerEntryType,
    currentBalance: bigint,
    amount: bigint,
  ): bigint {
    const increasesOnDebit =
      accountType === AccountType.ASSET ||
      accountType === AccountType.EXPENSE;

    const increases = increasesOnDebit
      ? entryType === LedgerEntryType.DEBIT
      : entryType === LedgerEntryType.CREDIT;

    return increases
      ? currentBalance + amount
      : currentBalance - amount;
  }
}
