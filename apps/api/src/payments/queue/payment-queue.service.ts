import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  Queue,
} from 'bullmq';

export const PAYMENT_QUEUE =
  'payments';

export interface PaymentJob {
  paymentId: string;
  organizationId: string;
}

@Injectable()
export class PaymentQueueService {
  constructor(
    @InjectQueue(PAYMENT_QUEUE)
    private readonly paymentQueue:
      Queue<PaymentJob>,
  ) {}

  async enqueue(
    paymentId: string,
    organizationId: string,
  ) {
    return this.paymentQueue.add(
      'process-payment',
      {
        paymentId,
        organizationId,
      },
      {
        attempts: 3,

        backoff: {
          type: 'exponential',
          delay: 1000,
        },

        removeOnComplete: 1000,

        removeOnFail: 5000,
      },
    );
  }
}
