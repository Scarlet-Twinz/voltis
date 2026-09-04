var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
export var WebhookDeliveryStatus;
(function (WebhookDeliveryStatus) {
    WebhookDeliveryStatus["PENDING"] = "pending";
    WebhookDeliveryStatus["DELIVERED"] = "delivered";
    WebhookDeliveryStatus["FAILED"] = "failed";
})(WebhookDeliveryStatus || (WebhookDeliveryStatus = {}));
let WebhookDelivery = class WebhookDelivery {
    id;
    endpointId;
    endpoint;
    eventId;
    eventType;
    payload;
    status;
    attempts;
    responseStatus;
    responseBody;
    failureReason;
    deliveredAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], WebhookDelivery.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], WebhookDelivery.prototype, "endpointId", void 0);
__decorate([
    ManyToOne('WebhookEndpoint', (endpoint) => endpoint.deliveries, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    JoinColumn({
        name: 'endpointId',
    }),
    __metadata("design:type", Function)
], WebhookDelivery.prototype, "endpoint", void 0);
__decorate([
    Column({ length: 150 }),
    __metadata("design:type", String)
], WebhookDelivery.prototype, "eventId", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], WebhookDelivery.prototype, "eventType", void 0);
__decorate([
    Column({
        type: 'jsonb',
    }),
    __metadata("design:type", Object)
], WebhookDelivery.prototype, "payload", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: WebhookDeliveryStatus,
        default: WebhookDeliveryStatus.PENDING,
    }),
    __metadata("design:type", String)
], WebhookDelivery.prototype, "status", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], WebhookDelivery.prototype, "attempts", void 0);
__decorate([
    Column({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], WebhookDelivery.prototype, "responseStatus", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WebhookDelivery.prototype, "responseBody", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WebhookDelivery.prototype, "failureReason", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], WebhookDelivery.prototype, "deliveredAt", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], WebhookDelivery.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], WebhookDelivery.prototype, "updatedAt", void 0);
WebhookDelivery = __decorate([
    Entity('webhook_deliveries'),
    Index(['endpointId']),
    Index(['eventId'])
], WebhookDelivery);
export { WebhookDelivery };
//# sourceMappingURL=webhook-delivery.entity.js.map