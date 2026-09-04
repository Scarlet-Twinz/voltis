import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { Account } from '../accounts/account.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { LedgerController } from './ledger.controller.js';
import { LedgerEntry } from './ledger-entry.entity.js';
import { LedgerService } from './ledger.service.js';

@Module({
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
export class LedgerModule {}
