var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
export var AccountType;
(function (AccountType) {
    AccountType["ASSET"] = "asset";
    AccountType["LIABILITY"] = "liability";
    AccountType["EQUITY"] = "equity";
    AccountType["REVENUE"] = "revenue";
    AccountType["EXPENSE"] = "expense";
})(AccountType || (AccountType = {}));
let Account = class Account {
    id;
    organizationId;
    organization;
    code;
    name;
    type;
    currency;
    balance;
    isActive;
    ledgerEntries;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Account.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], Account.prototype, "organizationId", void 0);
__decorate([
    ManyToOne('Organization', (organization) => organization.accounts, {
        nullable: false,
        onDelete: 'RESTRICT',
    }),
    JoinColumn({ name: 'organizationId' }),
    __metadata("design:type", Function)
], Account.prototype, "organization", void 0);
__decorate([
    Column({ length: 50 }),
    __metadata("design:type", String)
], Account.prototype, "code", void 0);
__decorate([
    Column({ length: 150 }),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: AccountType,
    }),
    __metadata("design:type", String)
], Account.prototype, "type", void 0);
__decorate([
    Column({ length: 3 }),
    __metadata("design:type", String)
], Account.prototype, "currency", void 0);
__decorate([
    Column({ type: 'bigint', default: 0 }),
    __metadata("design:type", String)
], Account.prototype, "balance", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Account.prototype, "isActive", void 0);
__decorate([
    OneToMany('LedgerEntry', (entry) => entry.account),
    __metadata("design:type", Array)
], Account.prototype, "ledgerEntries", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Account.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Account.prototype, "updatedAt", void 0);
Account = __decorate([
    Entity('accounts'),
    Index(['organizationId', 'code'], { unique: true })
], Account);
export { Account };
//# sourceMappingURL=account.entity.js.map