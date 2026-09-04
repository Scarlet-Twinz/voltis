var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsNotEmpty, IsString, IsUUID, Length, Matches, } from 'class-validator';
import { AccountType } from '../account.entity.js';
export class CreateAccountDto {
    organizationId;
    code;
    name;
    type;
    currency;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "organizationId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    Length(2, 50),
    Matches(/^[A-Za-z0-9_-]+$/, {
        message: 'code must contain only letters, numbers, underscores, and hyphens',
    }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "code", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    Length(2, 150),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "name", void 0);
__decorate([
    IsEnum(AccountType),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "type", void 0);
__decorate([
    IsString(),
    Length(3, 3),
    Matches(/^[A-Z]{3}$/, {
        message: 'currency must be a valid 3-letter uppercase currency code',
    }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "currency", void 0);
//# sourceMappingURL=create-account.dto.js.map