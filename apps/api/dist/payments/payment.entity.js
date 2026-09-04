var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (PaymentStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["WALLET"] = "wallet";
    PaymentMethod["CASH"] = "cash";
})(PaymentMethod || (PaymentMethod = {}));
let Payment = class Payment {
    id;
    organizationId;
    reference;
    idempotencyKey;
    requestFingerprint;
    transactionId;
    status;
    method;
    amount;
    currency;
    processorReference;
    failureReason;
    metadata;
    createdAt;
    updatedAt;
    processedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Payment.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], Payment.prototype, "organizationId", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Payment.prototype, "reference", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Payment.prototype, "idempotencyKey", void 0);
__decorate([
    Column({ length: 64 }),
    __metadata("design:type", String)
], Payment.prototype, "requestFingerprint", void 0);
__decorate([
    Column('uuid', { nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "transactionId", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: PaymentMethod,
    }),
    __metadata("design:type", String)
], Payment.prototype, "method", void 0);
__decorate([
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], Payment.prototype, "amount", void 0);
__decorate([
    Column({ length: 3 }),
    __metadata("design:type", String)
], Payment.prototype, "currency", void 0);
__decorate([
    Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "processorReference", void 0);
__decorate([
    Column({
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "failureReason", void 0);
__decorate([
    Column({
        type: 'jsonb',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Payment.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Payment.prototype, "updatedAt", void 0);
__decorate([
    Column({
        type: 'timestamptz',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "processedAt", void 0);
Payment = __decorate([
    Entity('payments'),
    Index(['organizationId', 'reference'], { unique: true }),
    Index(['organizationId', 'idempotencyKey'], { unique: true })
], Payment);
export { Payment };
//# sourceMappingURL=payment.entity.js.map