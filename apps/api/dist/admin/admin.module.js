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
let AdminModule = class AdminModule {
};
AdminModule = __decorate([
    Module({
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
], AdminModule);
export { AdminModule };
//# sourceMappingURL=admin.module.js.map