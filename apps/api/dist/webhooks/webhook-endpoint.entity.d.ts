import type { WebhookDelivery } from './webhook-delivery.entity.js';
export declare class WebhookEndpoint {
    id: string;
    organizationId: string;
    url: string;
    secret: string;
    isActive: boolean;
    deliveries: WebhookDelivery[];
    createdAt: Date;
    updatedAt: Date;
}
