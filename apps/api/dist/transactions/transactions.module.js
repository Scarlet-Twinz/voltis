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
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
import { Transaction } from './transaction.entity.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
let TransactionsModule = class TransactionsModule {
};
TransactionsModule = __decorate([
    Module({
        imports: [
            AuthModule,
            TypeOrmModule.forFeature([
                Transaction,
                Account,
                LedgerEntry,
            ]),
        ],
        controllers: [TransactionsController],
        providers: [TransactionsService],
        exports: [TransactionsService],
    })
], TransactionsModule);
export { TransactionsModule };
//# sourceMappingURL=transactions.module.js.map