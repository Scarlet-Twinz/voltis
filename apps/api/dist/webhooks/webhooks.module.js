var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { WebhookDelivery } from './webhook-delivery.entity.js';
import { WebhookEndpoint } from './webhook-endpoint.entity.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
let WebhooksModule = class WebhooksModule {
};
WebhooksModule = __decorate([
    Module({
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
], WebhooksModule);
export { WebhooksModule };
//# sourceMappingURL=webhooks.module.js.map