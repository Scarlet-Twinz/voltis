import type { Organization } from '../organizations/organization.entity.js';
import type { LedgerEntry } from '../ledger/ledger-entry.entity.js';
export declare enum AccountType {
    ASSET = "asset",
    LIABILITY = "liability",
    EQUITY = "equity",
    REVENUE = "revenue",
    EXPENSE = "expense"
}
export declare class Account {
    id: string;
    organizationId: string;
    organization: Organization;
    code: string;
    name: string;
    type: AccountType;
    currency: string;
    balance: string;
    isActive: boolean;
    ledgerEntries: LedgerEntry[];
    createdAt: Date;
    updatedAt: Date;
}
