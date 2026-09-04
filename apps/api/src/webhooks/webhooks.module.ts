import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';

import { WebhookDelivery } from './webhook-delivery.entity.js';
import { WebhookEndpoint } from './webhook-endpoint.entity.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      WebhookEndpoint,
      WebhookDelivery,
      Organization,
      Payment,
    ]),
  ],
  controllers: [
    WebhooksController,
  ],
  providers: [
    WebhooksService,
  ],
  exports: [
    WebhooksService,
  ],
})
export class WebhooksModule {}
