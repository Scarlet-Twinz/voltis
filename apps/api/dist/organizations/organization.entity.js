var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
let Organization = class Organization {
    id;
    name;
    slug;
    defaultCurrency;
    isActive;
    owner;
    ownerId;
    accounts;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Organization.prototype, "id", void 0);
__decorate([
    Column({ length: 150 }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    Column({ unique: true, length: 100 }),
    __metadata("design:type", String)
], Organization.prototype, "slug", void 0);
__decorate([
    Column({ length: 3, default: 'USD' }),
    __metadata("design:type", String)
], Organization.prototype, "defaultCurrency", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Organization.prototype, "isActive", void 0);
__decorate([
    ManyToOne('User', (user) => user.organizations, {
        nullable: false,
        onDelete: 'RESTRICT',
    }),
    JoinColumn({ name: 'ownerId' }),
    __metadata("design:type", Function)
], Organization.prototype, "owner", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], Organization.prototype, "ownerId", void 0);
__decorate([
    OneToMany('Account', (account) => account.organization),
    __metadata("design:type", Array)
], Organization.prototype, "accounts", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Organization.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Organization.prototype, "updatedAt", void 0);
Organization = __decorate([
    Entity('organizations')
], Organization);
export { Organization };
//# sourceMappingURL=organization.entity.js.map