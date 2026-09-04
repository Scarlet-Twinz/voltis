import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import {
  PAYMENT_QUEUE,
  PaymentQueueService,
} from './payment-queue.service.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE,
    }),
  ],
  providers: [PaymentQueueService],
  exports: [PaymentQueueService],
})
export class PaymentQueueModule {}
