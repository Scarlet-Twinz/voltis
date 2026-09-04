import type { ReconciliationDiscrepancy } from './reconciliation-discrepancy.entity.js';
export declare enum ReconciliationStatus {
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class ReconciliationRun {
    id: string;
    organizationId: string;
    status: ReconciliationStatus;
    paymentsChecked: number;
    transactionsChecked: number;
    ledgerEntriesChecked: number;
    matchedCount: number;
    discrepancyCount: number;
    failureReason: string | null;
    completedAt: Date | null;
    discrepancies: ReconciliationDiscrepancy[];
    createdAt: Date;
}
