var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService, } from '@nestjs/config';
import { PAYMENT_DEAD_LETTER_QUEUE, PaymentProcessor, } from './payments/payment.processor.js';
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
            BullModule.registerQueue({
                name: 'payments',
            }, {
                name: PAYMENT_DEAD_LETTER_QUEUE,
            }),
        ],
        providers: [
            PaymentProcessor,
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map