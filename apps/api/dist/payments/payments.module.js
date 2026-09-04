var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let PaymentsModule = class PaymentsModule {
};
PaymentsModule = __decorate([
    Module({
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
], PaymentsModule);
export { PaymentsModule };
//# sourceMappingURL=payments.module.js.map