import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Account } from '../accounts/account.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import {
  ReconciliationRun,
} from '../reconciliation/reconciliation-run.entity.js';
import { RiskAssessment } from '../risk/risk-assessment.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Account,
      Organization,
      Payment,
      Transaction,
      LedgerEntry,
      RiskAssessment,
      ReconciliationRun,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
