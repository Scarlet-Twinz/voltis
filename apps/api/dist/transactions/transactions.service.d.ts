import { DataSource, Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity.js';
import { Transaction, TransactionStatus } from './transaction.entity.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
export declare class TransactionsService {
    private readonly transactionsRepository;
    private readonly accountsRepository;
    private readonly dataSource;
    constructor(transactionsRepository: Repository<Transaction>, accountsRepository: Repository<Account>, dataSource: DataSource);
    create(userId: string, dto: CreateTransactionDto): Promise<{
        transaction: {
            id: string;
            organizationId: string;
            reference: string;
            type: import("./transaction.entity.js").TransactionType;
            status: TransactionStatus.COMPLETED;
            amount: string;
            currency: string;
            description: string | null;
            processedAt: Date;
            createdAt: Date;
        };
        ledger: {
            debit: {
                accountId: string;
                accountCode: string;
                accountType: AccountType;
                amount: string;
                currency: string;
                balanceAfter: string;
            };
            credit: {
                accountId: string;
                accountCode: string;
                accountType: AccountType;
                amount: string;
                currency: string;
                balanceAfter: string;
            };
            balanced: boolean;
        };
    }>;
    findAllForUser(userId: string, organizationId: string): Promise<Transaction[]>;
    findOneForUser(userId: string, transactionId: string): Promise<Transaction>;
    private calculateBalance;
    private generateReference;
}
