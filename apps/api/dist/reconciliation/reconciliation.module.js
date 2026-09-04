var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let ReconciliationModule = class ReconciliationModule {
};
ReconciliationModule = __decorate([
    Module({
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
], ReconciliationModule);
export { ReconciliationModule };
//# sourceMappingURL=reconciliation.module.js.map