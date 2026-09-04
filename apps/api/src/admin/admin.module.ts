import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Account } from '../accounts/account.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { ReconciliationDiscrepancy } from '../reconciliation/reconciliation-discrepancy.entity.js';
import { ReconciliationRun } from '../reconciliation/reconciliation-run.entity.js';
import { RiskAssessment } from '../risk/risk-assessment.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { User } from '../users/user.entity.js';
import { WebhookDelivery } from '../webhooks/webhook-delivery.entity.js';
import { WebhookEndpoint } from '../webhooks/webhook-endpoint.entity.js';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      User,
      Organization,
      Account,
      Payment,
      Transaction,
      RiskAssessment,
      ReconciliationRun,
      ReconciliationDiscrepancy,
      WebhookEndpoint,
      WebhookDelivery,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
