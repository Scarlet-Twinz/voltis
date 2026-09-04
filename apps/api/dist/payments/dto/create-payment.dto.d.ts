import { PaymentMethod } from '../payment.entity.js';
export declare class CreatePaymentDto {
    organizationId: string;
    debitAccountId: string;
    creditAccountId: string;
    method: PaymentMethod;
    amount: string;
    currency: string;
    idempotencyKey: string;
    description?: string;
    metadata?: Record<string, unknown>;
}
