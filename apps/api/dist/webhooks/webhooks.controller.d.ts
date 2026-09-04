import type { Request } from 'express';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto.js';
import { WebhooksService } from './webhooks.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    createEndpoint(request: AuthenticatedRequest, organizationId: string, dto: CreateWebhookEndpointDto): Promise<import("./webhook-endpoint.entity.js").WebhookEndpoint>;
    findEndpoints(request: AuthenticatedRequest, organizationId: string): Promise<import("./webhook-endpoint.entity.js").WebhookEndpoint[]>;
    removeEndpoint(request: AuthenticatedRequest, endpointId: string): Promise<{
        deleted: boolean;
        endpointId: string;
    }>;
    findDeliveries(request: AuthenticatedRequest, organizationId: string): Promise<import("./webhook-delivery.entity.js").WebhookDelivery[]>;
}
export {};
