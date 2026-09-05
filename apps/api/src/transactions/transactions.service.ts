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
import { LedgerEntry, LedgerEntryType } from '../ledger/ledger-entry.entity.js';
import { Organization } from '../organizations/organization.entity.js';
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

    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,

    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.dataSource.transaction(async (manager) => {
      const accountRepository = manager.getRepository(Account);
      const transactionRepository = manager.getRepository(Transaction);
      const ledgerRepository = manager.getRepository(LedgerEntry);

      if (dto.debitAccountId === dto.creditAccountId) {
        throw new ConflictException('Debit and credit accounts must be different');
      }

      const amount = BigInt(dto.amount);
      if (amount <= 0n) {
        throw new ConflictException('Transaction amount must be greater than zero');
      }

      const organization = await manager.getRepository(Organization).findOne({
        where: { id: dto.organizationId, ownerId: userId, isActive: true },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const accountIds = [dto.debitAccountId, dto.creditAccountId].sort();
      const lockedAccounts = await accountRepository
        .createQueryBuilder('account')
        .innerJoinAndSelect('account.organization', 'organization')
        .where('account.id IN (:...accountIds)', { accountIds })
        .andWhere('account.isActive = :isActive', { isActive: true })
        .orderBy('account.id', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      if (lockedAccounts.length !== 2) {
        const debitAccount = lockedAccounts.find((account) => account.id === dto.debitAccountId);
        if (!debitAccount) throw new NotFoundException('Debit account not found');
        throw new NotFoundException('Credit account not found');
      }

      const debitAccount = lockedAccounts.find((account) => account.id === dto.debitAccountId);
      const creditAccount = lockedAccounts.find((account) => account.id === dto.creditAccountId);

      if (!debitAccount || !creditAccount) {
        throw new NotFoundException('Transaction accounts not found');
      }

      if (
        debitAccount.organizationId !== organization.id ||
        creditAccount.organizationId !== organization.id
      ) {
        throw new ConflictException('Both accounts must belong to the selected organization');
      }

      if (debitAccount.currency !== dto.currency || creditAccount.currency !== dto.currency) {
        throw new ConflictException('Transaction currency must match both account currencies');
      }

      const reference = this.generateReference();
      const transaction = transactionRepository.create({
        organizationId: organization.id,
        reference,
        type: dto.type,
        status: TransactionStatus.PROCESSING,
        amount: amount.toString(),
        currency: dto.currency,
        description: dto.description?.trim() ?? null,
        metadata: dto.metadata ?? null,
        processedAt: null,
      });

      const savedTransaction = await transactionRepository.save(transaction);

      const debitEntry = ledgerRepository.create({
        transactionId: savedTransaction.id,
        transaction: savedTransaction,
        accountId: debitAccount.id,
        account: debitAccount,
        type: LedgerEntryType.DEBIT,
        amount: amount.toString(),
        currency: dto.currency,
        description: dto.description?.trim() ?? `Debit for ${reference}`,
      });

      const creditEntry = ledgerRepository.create({
        transactionId: savedTransaction.id,
        transaction: savedTransaction,
        accountId: creditAccount.id,
        account: creditAccount,
        type: LedgerEntryType.CREDIT,
        amount: amount.toString(),
        currency: dto.currency,
        description: dto.description?.trim() ?? `Credit for ${reference}`,
      });

      if (BigInt(debitEntry.amount) !== BigInt(creditEntry.amount)) {
        throw new ConflictException('Transaction is not balanced');
      }

      const debitBalance = BigInt(debitAccount.balance);
      const creditBalance = BigInt(creditAccount.balance);
      const newDebitBalance = this.calculateBalance(
        debitAccount.type,
        LedgerEntryType.DEBIT,
        debitBalance,
        amount,
      );
      const newCreditBalance = this.calculateBalance(
        creditAccount.type,
        LedgerEntryType.CREDIT,
        creditBalance,
        amount,
      );

      if (newDebitBalance < 0n) {
        throw new ConflictException(`Insufficient balance in debit account ${debitAccount.code}`);
      }
      if (newCreditBalance < 0n) {
        throw new ConflictException(`Insufficient balance in credit account ${creditAccount.code}`);
      }

      await ledgerRepository.save([debitEntry, creditEntry]);

      debitAccount.balance = newDebitBalance.toString();
      creditAccount.balance = newCreditBalance.toString();
      await accountRepository.save([debitAccount, creditAccount]);

      savedTransaction.status = TransactionStatus.COMPLETED;
      savedTransaction.processedAt = new Date();
      await transactionRepository.save(savedTransaction);

      return {
        transaction: {
          id: savedTransaction.id,
          organizationId: savedTransaction.organizationId,
          reference: savedTransaction.reference,
          type: savedTransaction.type,
          status: savedTransaction.status,
          amount: savedTransaction.amount,
          currency: savedTransaction.currency,
          description: savedTransaction.description,
          processedAt: savedTransaction.processedAt,
          createdAt: savedTransaction.createdAt,
        },
        ledger: {
          debit: {
            accountId: debitAccount.id,
            accountCode: debitAccount.code,
            accountType: debitAccount.type,
            amount: amount.toString(),
            currency: dto.currency,
            balanceAfter: debitAccount.balance,
          },
          credit: {
            accountId: creditAccount.id,
            accountCode: creditAccount.code,
            accountType: creditAccount.type,
            amount: amount.toString(),
            currency: dto.currency,
            balanceAfter: creditAccount.balance,
          },
          balanced: true,
        },
      };
    });
  }

  async findAllForUser(userId: string, organizationId: string) {
    await this.getOrganizationForUser(userId, organizationId);

    return this.transactionsRepository.find({
      where: { organizationId },
      relations: { ledgerEntries: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(userId: string, transactionId: string) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: { ledgerEntries: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.getOrganizationForUser(userId, transaction.organizationId);
    return transaction;
  }

  private async getOrganizationForUser(userId: string, organizationId: string) {
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId, ownerId: userId, isActive: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private calculateBalance(
    accountType: AccountType,
    entryType: LedgerEntryType,
    currentBalance: bigint,
    amount: bigint,
  ): bigint {
    const increasesOnDebit =
      accountType === AccountType.ASSET || accountType === AccountType.EXPENSE;
    const increases = increasesOnDebit
      ? entryType === LedgerEntryType.DEBIT
      : entryType === LedgerEntryType.CREDIT;

    return increases ? currentBalance + amount : currentBalance - amount;
  }

  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }
}
