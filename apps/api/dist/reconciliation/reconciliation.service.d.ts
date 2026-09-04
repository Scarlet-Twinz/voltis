import { DataSource, Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { ReconciliationDiscrepancy } from './reconciliation-discrepancy.entity.js';
import { ReconciliationRun } from './reconciliation-run.entity.js';
export declare class ReconciliationService {
    private readonly runsRepository;
    private readonly discrepanciesRepository;
    private readonly paymentsRepository;
    private readonly transactionsRepository;
    private readonly ledgerEntriesRepository;
    private readonly organizationsRepository;
    private readonly dataSource;
    constructor(runsRepository: Repository<ReconciliationRun>, discrepanciesRepository: Repository<ReconciliationDiscrepancy>, paymentsRepository: Repository<Payment>, transactionsRepository: Repository<Transaction>, ledgerEntriesRepository: Repository<LedgerEntry>, organizationsRepository: Repository<Organization>, dataSource: DataSource);
    reconcile(userId: string, organizationId: string): Promise<ReconciliationRun | null>;
    getRun(runId: string): Promise<ReconciliationRun | null>;
    findRunsForUser(userId: string, organizationId: string): Promise<ReconciliationRun[]>;
    private recordDiscrepancy;
}
