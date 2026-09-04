import type { WebhookEndpoint } from './webhook-endpoint.entity.js';
export declare enum WebhookDeliveryStatus {
    PENDING = "pending",
    DELIVERED = "delivered",
    FAILED = "failed"
}
export declare class WebhookDelivery {
    id: string;
    endpointId: string;
    endpoint: WebhookEndpoint;
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    status: WebhookDeliveryStatus;
    attempts: number;
    responseStatus: number | null;
    responseBody: string | null;
    failureReason: string | null;
    deliveredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
