import { TransactionType } from '../transaction.entity.js';
export declare class CreateTransactionDto {
    organizationId: string;
    debitAccountId: string;
    creditAccountId: string;
    type: TransactionType;
    amount: string;
    currency: string;
    description?: string;
    metadata?: Record<string, unknown>;
}
