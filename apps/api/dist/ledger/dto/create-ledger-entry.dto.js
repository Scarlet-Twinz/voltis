var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsNotEmpty, IsString, IsUUID, Matches, MaxLength, MinLength, } from 'class-validator';
import { LedgerEntryType } from '../ledger-entry.entity.js';
export class CreateLedgerEntryDto {
    transactionId;
    accountId;
    type;
    amount;
    currency;
    description;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "transactionId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "accountId", void 0);
__decorate([
    IsEnum(LedgerEntryType),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "type", void 0);
__decorate([
    IsString(),
    Matches(/^[0-9]+$/, {
        message: 'amount must be a positive integer in minor currency units',
    }),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "amount", void 0);
__decorate([
    IsString(),
    MinLength(3),
    MaxLength(3),
    Matches(/^[A-Z]{3}$/, {
        message: 'currency must be a valid 3-letter uppercase currency code',
    }),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "currency", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "description", void 0);
//# sourceMappingURL=create-ledger-entry.dto.js.map