export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum PaymentMethod {
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    WALLET = "wallet",
    CASH = "cash"
}
export declare class Payment {
    id: string;
    organizationId: string;
    reference: string;
    idempotencyKey: string;
    requestFingerprint: string;
    transactionId: string | null;
    status: PaymentStatus;
    method: PaymentMethod;
    amount: string;
    currency: string;
    processorReference: string | null;
    failureReason: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    processedAt: Date | null;
}
