import { DataSource, Repository } from 'typeorm';
import { Account } from '../accounts/account.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { LedgerEntry, LedgerEntryType } from './ledger-entry.entity.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
export declare class LedgerService {
    private readonly ledgerRepository;
    private readonly accountsRepository;
    private readonly transactionsRepository;
    private readonly dataSource;
    constructor(ledgerRepository: Repository<LedgerEntry>, accountsRepository: Repository<Account>, transactionsRepository: Repository<Transaction>, dataSource: DataSource);
    createEntry(userId: string, dto: CreateLedgerEntryDto): Promise<{
        id: string;
        transactionId: string;
        accountId: string;
        type: LedgerEntryType;
        amount: string;
        currency: string;
        description: string | null;
        createdAt: Date;
        balanceAfter: string;
    }>;
    findByTransaction(userId: string, transactionId: string): Promise<LedgerEntry[]>;
}
