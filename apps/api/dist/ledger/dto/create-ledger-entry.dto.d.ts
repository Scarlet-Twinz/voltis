import { LedgerEntryType } from '../ledger-entry.entity.js';
export declare class CreateLedgerEntryDto {
    transactionId: string;
    accountId: string;
    type: LedgerEntryType;
    amount: string;
    currency: string;
    description: string;
}
