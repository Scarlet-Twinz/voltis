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
import { Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomUUID, } from 'node:crypto';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { WebhookDelivery, WebhookDeliveryStatus, } from './webhook-delivery.entity.js';
import { WebhookEndpoint } from './webhook-endpoint.entity.js';
let WebhooksService = class WebhooksService {
    endpointsRepository;
    deliveriesRepository;
    organizationsRepository;
    paymentsRepository;
    constructor(endpointsRepository, deliveriesRepository, organizationsRepository, paymentsRepository) {
        this.endpointsRepository = endpointsRepository;
        this.deliveriesRepository = deliveriesRepository;
        this.organizationsRepository = organizationsRepository;
        this.paymentsRepository = paymentsRepository;
    }
    async createEndpoint(userId, organizationId, dto) {
        await this.assertOrganizationOwner(userId, organizationId);
        const endpoint = this.endpointsRepository.create({
            organizationId,
            url: dto.url,
            secret: dto.secret,
            isActive: true,
        });
        return this.endpointsRepository.save(endpoint);
    }
    async findEndpointsForUser(userId, organizationId) {
        await this.assertOrganizationOwner(userId, organizationId);
        return this.endpointsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async removeEndpoint(userId, endpointId) {
        const endpoint = await this.endpointsRepository.findOne({
            where: {
                id: endpointId,
            },
        });
        if (!endpoint) {
            throw new NotFoundException('Webhook endpoint not found');
        }
        await this.assertOrganizationOwner(userId, endpoint.organizationId);
        await this.endpointsRepository.delete(endpoint.id);
        return {
            deleted: true,
            endpointId,
        };
    }
    async createPaymentEvent(paymentId, eventType) {
        const payment = await this.paymentsRepository.findOne({
            where: {
                id: paymentId,
            },
        });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        const endpoints = await this.endpointsRepository.find({
            where: {
                organizationId: payment.organizationId,
                isActive: true,
            },
        });
        const eventId = `evt_${randomUUID()}`;
        const payload = {
            id: eventId,
            type: eventType,
            createdAt: new Date().toISOString(),
            data: {
                paymentId: payment.id,
                reference: payment.reference,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
                transactionId: payment.transactionId,
            },
        };
        const deliveries = endpoints.map((endpoint) => this.deliveriesRepository.create({
            endpointId: endpoint.id,
            eventId,
            eventType,
            payload,
            status: WebhookDeliveryStatus.PENDING,
            attempts: 0,
            responseStatus: null,
            responseBody: null,
            failureReason: null,
            deliveredAt: null,
        }));
        if (deliveries.length > 0) {
            await this.deliveriesRepository.save(deliveries);
        }
        return {
            eventId,
            eventType,
            deliveryCount: deliveries.length,
        };
    }
    async deliver(deliveryId) {
        const delivery = await this.deliveriesRepository.findOne({
            where: {
                id: deliveryId,
            },
            relations: {
                endpoint: true,
            },
        });
        if (!delivery) {
            throw new NotFoundException('Webhook delivery not found');
        }
        if (delivery.status ===
            WebhookDeliveryStatus.DELIVERED) {
            return delivery;
        }
        delivery.attempts += 1;
        const body = JSON.stringify(delivery.payload);
        const signature = createHmac('sha256', delivery.endpoint.secret)
            .update(body)
            .digest('hex');
        try {
            const response = await fetch(delivery.endpoint.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VOLTIS-Event': delivery.eventType,
                    'X-VOLTIS-Event-Id': delivery.eventId,
                    'X-VOLTIS-Signature': `sha256=${signature}`,
                },
                body,
            });
            const responseBody = await response.text();
            delivery.responseStatus =
                response.status;
            delivery.responseBody =
                responseBody.slice(0, 5000);
            if (response.ok) {
                delivery.status =
                    WebhookDeliveryStatus.DELIVERED;
                delivery.failureReason =
                    null;
                delivery.deliveredAt =
                    new Date();
            }
            else {
                delivery.status =
                    WebhookDeliveryStatus.FAILED;
                delivery.failureReason =
                    `Webhook returned HTTP ${response.status}`;
            }
        }
        catch (error) {
            delivery.status =
                WebhookDeliveryStatus.FAILED;
            delivery.failureReason =
                error instanceof Error
                    ? error.message
                    : 'Webhook delivery failed';
        }
        return this.deliveriesRepository.save(delivery);
    }
    async findDeliveriesForUser(userId, organizationId) {
        await this.assertOrganizationOwner(userId, organizationId);
        return this.deliveriesRepository
            .createQueryBuilder('delivery')
            .innerJoinAndSelect('delivery.endpoint', 'endpoint')
            .where('endpoint.organizationId = :organizationId', { organizationId })
            .orderBy('delivery.createdAt', 'DESC')
            .getMany();
    }
    async assertOrganizationOwner(userId, organizationId) {
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: organizationId,
                ownerId: userId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }
    }
};
WebhooksService = __decorate([
    Injectable(),
    __param(0, InjectRepository(WebhookEndpoint)),
    __param(1, InjectRepository(WebhookDelivery)),
    __param(2, InjectRepository(Organization)),
    __param(3, InjectRepository(Payment)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository])
], WebhooksService);
export { WebhooksService };
//# sourceMappingURL=webhooks.service.js.map