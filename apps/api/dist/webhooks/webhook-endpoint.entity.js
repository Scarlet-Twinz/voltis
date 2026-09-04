var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
let WebhookEndpoint = class WebhookEndpoint {
    id;
    organizationId;
    url;
    secret;
    isActive;
    deliveries;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], WebhookEndpoint.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], WebhookEndpoint.prototype, "organizationId", void 0);
__decorate([
    Column({ length: 500 }),
    __metadata("design:type", String)
], WebhookEndpoint.prototype, "url", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], WebhookEndpoint.prototype, "secret", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], WebhookEndpoint.prototype, "isActive", void 0);
__decorate([
    OneToMany('WebhookDelivery', (delivery) => delivery.endpoint),
    __metadata("design:type", Array)
], WebhookEndpoint.prototype, "deliveries", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], WebhookEndpoint.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], WebhookEndpoint.prototype, "updatedAt", void 0);
WebhookEndpoint = __decorate([
    Entity('webhook_endpoints'),
    Index(['organizationId', 'url'], {
        unique: true,
    })
], WebhookEndpoint);
export { WebhookEndpoint };
//# sourceMappingURL=webhook-endpoint.entity.js.map