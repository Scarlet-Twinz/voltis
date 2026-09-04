var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentProcessor_1;
import { Injectable, Logger, } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost, } from '@nestjs/bullmq';
import { Queue, } from 'bullmq';
export const PAYMENT_DEAD_LETTER_QUEUE = 'payments-dead-letter';
let PaymentProcessor = PaymentProcessor_1 = class PaymentProcessor extends WorkerHost {
    deadLetterQueue;
    logger = new Logger(PaymentProcessor_1.name);
    constructor(deadLetterQueue) {
        super();
        this.deadLetterQueue = deadLetterQueue;
    }
    async process(job) {
        const apiUrl = process.env.VOLTIS_API_URL ??
            'http://localhost:4001';
        const workerSecret = process.env.WORKER_SECRET ??
            'voltis-worker-development-secret';
        const maxAttempts = job.opts.attempts ?? 1;
        const currentAttempt = job.attemptsMade + 1;
        this.logger.log(`Processing payment ${job.data.paymentId} ` +
            `(attempt ${currentAttempt}/${maxAttempts})`);
        try {
            const response = await fetch(`${apiUrl}/payments/process-internal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-voltis-worker-secret': workerSecret,
                },
                body: JSON.stringify({
                    paymentId: job.data.paymentId,
                    organizationId: job.data.organizationId,
                    attempt: currentAttempt,
                    maxAttempts,
                }),
            });
            const responseText = await response.text();
            if (!response.ok) {
                throw new Error(`Payment processing failed (${response.status}): ${responseText}`);
            }
            this.logger.log(`Payment ${job.data.paymentId} processed successfully`);
            return responseText
                ? JSON.parse(responseText)
                : {
                    success: true,
                };
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Unknown payment processing error';
            this.logger.error(`Payment ${job.data.paymentId} failed ` +
                `(attempt ${currentAttempt}/${maxAttempts}): ${message}`);
            const finalAttempt = currentAttempt >= maxAttempts;
            if (finalAttempt) {
                await this.deadLetterQueue.add('payment-dead-letter', {
                    paymentId: job.data.paymentId,
                    organizationId: job.data.organizationId,
                }, {
                    removeOnComplete: 1000,
                    removeOnFail: 5000,
                });
                this.logger.error(`Payment ${job.data.paymentId} moved to dead-letter queue`);
            }
            throw error;
        }
    }
};
PaymentProcessor = PaymentProcessor_1 = __decorate([
    Injectable(),
    Processor('payments'),
    __param(0, InjectQueue(PAYMENT_DEAD_LETTER_QUEUE)),
    __metadata("design:paramtypes", [Queue])
], PaymentProcessor);
export { PaymentProcessor };
//# sourceMappingURL=payment.processor.js.map