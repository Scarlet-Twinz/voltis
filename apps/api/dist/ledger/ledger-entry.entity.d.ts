import type { Account } from '../accounts/account.entity.js';
import type { Transaction } from '../transactions/transaction.entity.js';
export declare enum LedgerEntryType {
    DEBIT = "debit",
    CREDIT = "credit"
}
export declare class LedgerEntry {
    id: string;
    transactionId: string;
    transaction: Transaction;
    accountId: string;
    account: Account;
    type: LedgerEntryType;
    amount: string;
    currency: string;
    description: string | null;
    createdAt: Date;
}
