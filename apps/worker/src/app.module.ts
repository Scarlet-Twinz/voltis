import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  PAYMENT_DEAD_LETTER_QUEUE,
  PaymentProcessor,
} from './payments/payment.processor.js';

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
          host:
            configService.get<string>(
              'REDIS_HOST',
              'localhost',
            ),

          port:
            configService.get<number>(
              'REDIS_PORT',
              6382,
            ),

          password:
            configService.get<string>(
              'REDIS_PASSWORD',
              '',
            ) || undefined,
        },
      }),
    }),

    BullModule.registerQueue(
      {
        name: 'payments',
      },
      {
        name:
          PAYMENT_DEAD_LETTER_QUEUE,
      },
    ),
  ],

  providers: [
    PaymentProcessor,
  ],
})
export class AppModule {}
