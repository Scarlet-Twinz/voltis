import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  InjectQueue,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import {
  Job,
  Queue,
} from 'bullmq';

interface PaymentJob {
  paymentId: string;
  organizationId: string;
}

export const PAYMENT_DEAD_LETTER_QUEUE =
  'payments-dead-letter';

@Injectable()
@Processor('payments')
export class PaymentProcessor
  extends WorkerHost {
  private readonly logger =
    new Logger(PaymentProcessor.name);

  constructor(
    @InjectQueue(
      PAYMENT_DEAD_LETTER_QUEUE,
    )
    private readonly deadLetterQueue:
      Queue<PaymentJob>,
  ) {
    super();
  }

  async process(
    job: Job<PaymentJob>,
  ) {
    const apiUrl =
      process.env.VOLTIS_API_URL ??
      'http://localhost:4001';

    const workerSecret =
      process.env.WORKER_SECRET ??
      'voltis-worker-development-secret';

    const maxAttempts =
      job.opts.attempts ?? 1;

    const currentAttempt =
      job.attemptsMade + 1;

    this.logger.log(
      `Processing payment ${job.data.paymentId} ` +
        `(attempt ${currentAttempt}/${maxAttempts})`,
    );

    try {
      const response =
        await fetch(
          `${apiUrl}/payments/process-internal`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'x-voltis-worker-secret':
                workerSecret,
            },

            body: JSON.stringify({
              paymentId:
                job.data.paymentId,

              organizationId:
                job.data.organizationId,

              attempt:
                currentAttempt,

              maxAttempts,
            }),
          },
        );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          `Payment processing failed (${response.status}): ${responseText}`,
        );
      }

      this.logger.log(
        `Payment ${job.data.paymentId} processed successfully`,
      );

      return responseText
        ? JSON.parse(responseText)
        : {
            success: true,
          };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown payment processing error';

      this.logger.error(
        `Payment ${job.data.paymentId} failed ` +
          `(attempt ${currentAttempt}/${maxAttempts}): ${message}`,
      );

      const finalAttempt =
        currentAttempt >= maxAttempts;

      if (finalAttempt) {
        await this.deadLetterQueue.add(
          'payment-dead-letter',
          {
            paymentId:
              job.data.paymentId,

            organizationId:
              job.data.organizationId,
          },
          {
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        );

        this.logger.error(
          `Payment ${job.data.paymentId} moved to dead-letter queue`,
        );
      }

      throw error;
    }
  }
}
