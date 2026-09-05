import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { AccountsModule } from './accounts/accounts.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { EventsModule } from './events/events.module.js';
import { LedgerModule } from './ledger/ledger.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ReconciliationModule } from './reconciliation/reconciliation.module.js';
import { RiskModule } from './risk/risk.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { UsersModule } from './users/users.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService,
      ) => ({
        connection: {
          host: configService.get<string>(
            'REDIS_HOST',
            'localhost',
          ),
          port: configService.get<number>(
            'REDIS_PORT',
            6379,
          ),
          password:
            configService.get<string>(
              'REDIS_PASSWORD',
              '',
            ) || undefined,
        },
      }),
    }),

    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AccountsModule,
    AnalyticsModule,
    TransactionsModule,
    LedgerModule,
    PaymentsModule,
    ReconciliationModule,
    WebhooksModule,
    RiskModule,
    EventsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
