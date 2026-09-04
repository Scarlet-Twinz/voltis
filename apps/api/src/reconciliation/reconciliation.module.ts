import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';

import { ReconciliationController } from './reconciliation.controller.js';
import { ReconciliationDiscrepancy } from './reconciliation-discrepancy.entity.js';
import { ReconciliationRun } from './reconciliation-run.entity.js';
import { ReconciliationService } from './reconciliation.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      ReconciliationRun,
      ReconciliationDiscrepancy,
      Payment,
      Transaction,
      LedgerEntry,
      Organization,
    ]),
  ],
  controllers: [
    ReconciliationController,
  ],
  providers: [
    ReconciliationService,
  ],
  exports: [
    ReconciliationService,
  ],
})
export class ReconciliationModule {}
