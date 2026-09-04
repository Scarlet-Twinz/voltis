import type { Request } from 'express';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { LedgerService } from './ledger.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class LedgerController {
    private readonly ledgerService;
    constructor(ledgerService: LedgerService);
    createEntry(request: AuthenticatedRequest, dto: CreateLedgerEntryDto): Promise<{
        id: string;
        transactionId: string;
        accountId: string;
        type: import("./ledger-entry.entity.js").LedgerEntryType;
        amount: string;
        currency: string;
        description: string | null;
        createdAt: Date;
        balanceAfter: string;
    }>;
    findByTransaction(request: AuthenticatedRequest, transactionId: string): Promise<import("./ledger-entry.entity.js").LedgerEntry[]>;
}
export {};
