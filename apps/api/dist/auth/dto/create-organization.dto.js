var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsNotEmpty, IsString, Length, Matches, } from 'class-validator';
export class CreateOrganizationDto {
    name;
    slug;
    defaultCurrency;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    Length(2, 150),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "name", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    Length(3, 100),
    Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'slug must contain only lowercase letters, numbers, and hyphens',
    }),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "slug", void 0);
__decorate([
    IsString(),
    Length(3, 3),
    Matches(/^[A-Z]{3}$/, {
        message: 'defaultCurrency must be a valid 3-letter uppercase currency code',
    }),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "defaultCurrency", void 0);
//# sourceMappingURL=create-organization.dto.js.map