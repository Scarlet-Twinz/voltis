import type { ReconciliationRun } from './reconciliation-run.entity.js';
export declare enum ReconciliationDiscrepancyType {
    MISSING_TRANSACTION = "missing_transaction",
    TRANSACTION_NOT_FOUND = "transaction_not_found",
    AMOUNT_MISMATCH = "amount_mismatch",
    CURRENCY_MISMATCH = "currency_mismatch",
    STATUS_MISMATCH = "status_mismatch",
    MISSING_LEDGER_ENTRIES = "missing_ledger_entries",
    UNBALANCED_LEDGER = "unbalanced_ledger",
    TRANSACTION_LEDGER_AMOUNT_MISMATCH = "transaction_ledger_amount_mismatch"
}
export declare class ReconciliationDiscrepancy {
    id: string;
    runId: string;
    run: ReconciliationRun;
    organizationId: string;
    type: ReconciliationDiscrepancyType;
    paymentId: string | null;
    transactionId: string | null;
    message: string;
    details: Record<string, unknown> | null;
    resolved: boolean;
    createdAt: Date;
}
