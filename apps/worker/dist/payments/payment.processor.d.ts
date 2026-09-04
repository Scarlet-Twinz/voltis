import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
interface PaymentJob {
    paymentId: string;
    organizationId: string;
}
export declare const PAYMENT_DEAD_LETTER_QUEUE = "payments-dead-letter";
export declare class PaymentProcessor extends WorkerHost {
    private readonly deadLetterQueue;
    private readonly logger;
    constructor(deadLetterQueue: Queue<PaymentJob>);
    process(job: Job<PaymentJob>): Promise<any>;
}
export {};
