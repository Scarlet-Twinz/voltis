import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { WebhookDelivery } from './webhook-delivery.entity.js';
import { WebhookEndpoint } from './webhook-endpoint.entity.js';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto.js';
export declare class WebhooksService {
    private readonly endpointsRepository;
    private readonly deliveriesRepository;
    private readonly organizationsRepository;
    private readonly paymentsRepository;
    constructor(endpointsRepository: Repository<WebhookEndpoint>, deliveriesRepository: Repository<WebhookDelivery>, organizationsRepository: Repository<Organization>, paymentsRepository: Repository<Payment>);
    createEndpoint(userId: string, organizationId: string, dto: CreateWebhookEndpointDto): Promise<WebhookEndpoint>;
    findEndpointsForUser(userId: string, organizationId: string): Promise<WebhookEndpoint[]>;
    removeEndpoint(userId: string, endpointId: string): Promise<{
        deleted: boolean;
        endpointId: string;
    }>;
    createPaymentEvent(paymentId: string, eventType: string): Promise<{
        eventId: string;
        eventType: string;
        deliveryCount: number;
    }>;
    deliver(deliveryId: string): Promise<WebhookDelivery>;
    findDeliveriesForUser(userId: string, organizationId: string): Promise<WebhookDelivery[]>;
    private assertOrganizationOwner;
}
