import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  createHmac,
  randomUUID,
} from 'node:crypto';
import { Repository } from 'typeorm';

import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';

import {
  WebhookDelivery,
  WebhookDeliveryStatus,
} from './webhook-delivery.entity.js';
import { WebhookEndpoint } from './webhook-endpoint.entity.js';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto.js';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookEndpoint)
    private readonly endpointsRepository:
      Repository<WebhookEndpoint>,

    @InjectRepository(WebhookDelivery)
    private readonly deliveriesRepository:
      Repository<WebhookDelivery>,

    @InjectRepository(Organization)
    private readonly organizationsRepository:
      Repository<Organization>,

    @InjectRepository(Payment)
    private readonly paymentsRepository:
      Repository<Payment>,
  ) {}

  async createEndpoint(
    userId: string,
    organizationId: string,
    dto: CreateWebhookEndpointDto,
  ) {
    await this.assertOrganizationOwner(
      userId,
      organizationId,
    );

    const endpoint =
      this.endpointsRepository.create({
        organizationId,
        url: dto.url,
        secret: dto.secret,
        isActive: true,
      });

    return this.endpointsRepository.save(
      endpoint,
    );
  }

  async findEndpointsForUser(
    userId: string,
    organizationId: string,
  ) {
    await this.assertOrganizationOwner(
      userId,
      organizationId,
    );

    return this.endpointsRepository.find({
      where: {
        organizationId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async removeEndpoint(
    userId: string,
    endpointId: string,
  ) {
    const endpoint =
      await this.endpointsRepository.findOne({
        where: {
          id: endpointId,
        },
      });

    if (!endpoint) {
      throw new NotFoundException(
        'Webhook endpoint not found',
      );
    }

    await this.assertOrganizationOwner(
      userId,
      endpoint.organizationId,
    );

    await this.endpointsRepository.delete(
      endpoint.id,
    );

    return {
      deleted: true,
      endpointId,
    };
  }

  async createPaymentEvent(
    paymentId: string,
    eventType: string,
  ) {
    const payment =
      await this.paymentsRepository.findOne({
        where: {
          id: paymentId,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    const endpoints =
      await this.endpointsRepository.find({
        where: {
          organizationId:
            payment.organizationId,
          isActive: true,
        },
      });

    const eventId =
      `evt_${randomUUID()}`;

    const payload = {
      id: eventId,
      type: eventType,
      createdAt:
        new Date().toISOString(),
      data: {
        paymentId: payment.id,
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        transactionId:
          payment.transactionId,
      },
    };

    const deliveries =
      endpoints.map(
        (endpoint) =>
          this.deliveriesRepository.create({
            endpointId: endpoint.id,
            eventId,
            eventType,
            payload,
            status:
              WebhookDeliveryStatus.PENDING,
            attempts: 0,
            responseStatus: null,
            responseBody: null,
            failureReason: null,
            deliveredAt: null,
          }),
      );

    if (deliveries.length > 0) {
      await this.deliveriesRepository.save(
        deliveries,
      );
    }

    return {
      eventId,
      eventType,
      deliveryCount:
        deliveries.length,
    };
  }

  async deliver(
    deliveryId: string,
  ) {
    const delivery =
      await this.deliveriesRepository.findOne({
        where: {
          id: deliveryId,
        },
        relations: {
          endpoint: true,
        },
      });

    if (!delivery) {
      throw new NotFoundException(
        'Webhook delivery not found',
      );
    }

    if (
      delivery.status ===
      WebhookDeliveryStatus.DELIVERED
    ) {
      return delivery;
    }

    delivery.attempts += 1;

    const body =
      JSON.stringify(delivery.payload);

    const signature =
      createHmac(
        'sha256',
        delivery.endpoint.secret,
      )
        .update(body)
        .digest('hex');

    try {
      const response =
        await fetch(
          delivery.endpoint.url,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',

              'X-VOLTIS-Event':
                delivery.eventType,

              'X-VOLTIS-Event-Id':
                delivery.eventId,

              'X-VOLTIS-Signature':
                `sha256=${signature}`,
            },
            body,
          },
        );

      const responseBody =
        await response.text();

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
      } else {
        delivery.status =
          WebhookDeliveryStatus.FAILED;

        delivery.failureReason =
          `Webhook returned HTTP ${response.status}`;
      }
    } catch (error) {
      delivery.status =
        WebhookDeliveryStatus.FAILED;

      delivery.failureReason =
        error instanceof Error
          ? error.message
          : 'Webhook delivery failed';
    }

    return this.deliveriesRepository.save(
      delivery,
    );
  }

  async findDeliveriesForUser(
    userId: string,
    organizationId: string,
  ) {
    await this.assertOrganizationOwner(
      userId,
      organizationId,
    );

    return this.deliveriesRepository
      .createQueryBuilder('delivery')
      .innerJoinAndSelect(
        'delivery.endpoint',
        'endpoint',
      )
      .where(
        'endpoint.organizationId = :organizationId',
        { organizationId },
      )
      .orderBy(
        'delivery.createdAt',
        'DESC',
      )
      .getMany();
  }

  private async assertOrganizationOwner(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }
  }
}
