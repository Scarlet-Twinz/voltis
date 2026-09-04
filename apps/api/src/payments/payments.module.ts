import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Account } from '../accounts/account.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { EventsModule } from '../events/events.module.js';
import { Organization } from '../organizations/organization.entity.js';
import { RiskModule } from '../risk/risk.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { Transaction } from '../transactions/transaction.entity.js';

import { Payment } from './payment.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PaymentQueueModule } from './queue/payment-queue.module.js';

@Module({
  imports: [
    AuthModule,
    TransactionsModule,
    PaymentQueueModule,
    RiskModule,
    EventsModule,
    TypeOrmModule.forFeature([
      Payment,
      Account,
      Organization,
      Transaction,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
