import type { LedgerEntry } from '../ledger/ledger-entry.entity.js';
export declare enum TransactionStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REVERSED = "reversed"
}
export declare enum TransactionType {
    PAYMENT = "payment",
    TRANSFER = "transfer",
    REFUND = "refund",
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    FEE = "fee",
    ADJUSTMENT = "adjustment"
}
export declare class Transaction {
    id: string;
    organizationId: string;
    reference: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    currency: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
    processedAt: Date | null;
    ledgerEntries: LedgerEntry[];
    createdAt: Date;
    updatedAt: Date;
}
