import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { Account } from '../accounts/account.entity.js';
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
import { Transaction } from './transaction.entity.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';

@Module({
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
export class TransactionsModule {}
