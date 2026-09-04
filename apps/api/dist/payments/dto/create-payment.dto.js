var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength, } from 'class-validator';
import { PaymentMethod } from '../payment.entity.js';
export class CreatePaymentDto {
    organizationId;
    debitAccountId;
    creditAccountId;
    method;
    amount;
    currency;
    idempotencyKey;
    description;
    metadata;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "organizationId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "debitAccountId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "creditAccountId", void 0);
__decorate([
    IsEnum(PaymentMethod),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "method", void 0);
__decorate([
    IsString(),
    Matches(/^[0-9]+$/, {
        message: 'amount must be a positive integer in minor currency units',
    }),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    IsString(),
    Matches(/^[A-Z]{3}$/, {
        message: 'currency must be a valid 3-letter uppercase currency code',
    }),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "currency", void 0);
__decorate([
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "idempotencyKey", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreatePaymentDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-payment.dto.js.map