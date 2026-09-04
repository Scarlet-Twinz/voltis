var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Account } from '../accounts/account.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { LedgerController } from './ledger.controller.js';
import { LedgerEntry } from './ledger-entry.entity.js';
import { LedgerService } from './ledger.service.js';
let LedgerModule = class LedgerModule {
};
LedgerModule = __decorate([
    Module({
        imports: [
            AuthModule,
            TypeOrmModule.forFeature([
                LedgerEntry,
                Account,
                Transaction,
            ]),
        ],
        controllers: [LedgerController],
        providers: [LedgerService],
        exports: [LedgerService],
    })
], LedgerModule);
export { LedgerModule };
//# sourceMappingURL=ledger.module.js.map