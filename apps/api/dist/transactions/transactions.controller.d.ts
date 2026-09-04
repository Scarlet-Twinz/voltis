import type { Request } from 'express';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { TransactionsService } from './transactions.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(request: AuthenticatedRequest, dto: CreateTransactionDto): Promise<{
        transaction: {
            id: string;
            organizationId: string;
            reference: string;
            type: import("./transaction.entity.js").TransactionType;
            status: import("./transaction.entity.js").TransactionStatus.COMPLETED;
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
                accountType: import("../accounts/account.entity.js").AccountType;
                amount: string;
                currency: string;
                balanceAfter: string;
            };
            credit: {
                accountId: string;
                accountCode: string;
                accountType: import("../accounts/account.entity.js").AccountType;
                amount: string;
                currency: string;
                balanceAfter: string;
            };
            balanced: boolean;
        };
    }>;
    findAll(request: AuthenticatedRequest, organizationId: string): Promise<import("./transaction.entity.js").Transaction[]>;
    findOne(request: AuthenticatedRequest, transactionId: string): Promise<import("./transaction.entity.js").Transaction>;
}
export {};
