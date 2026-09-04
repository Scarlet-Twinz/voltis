var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService, } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module.js';
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
            }),
            BullModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6382),
                        password: configService.get('REDIS_PASSWORD', '') || undefined,
                    },
                }),
            }),
            DatabaseModule,
            AuthModule,
            UsersModule,
            OrganizationsModule,
            AccountsModule,
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
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map