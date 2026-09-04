import { Queue } from 'bullmq';
export declare const PAYMENT_QUEUE = "payments";
export interface PaymentJob {
    paymentId: string;
    organizationId: string;
}
export declare class PaymentQueueService {
    private readonly paymentQueue;
    constructor(paymentQueue: Queue<PaymentJob>);
    enqueue(paymentId: string, organizationId: string): Promise<import("bullmq").Job<PaymentJob, any, string, import("bullmq").JobProgress>>;
}
