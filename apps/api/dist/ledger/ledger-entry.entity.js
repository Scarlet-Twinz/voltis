var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
export var LedgerEntryType;
(function (LedgerEntryType) {
    LedgerEntryType["DEBIT"] = "debit";
    LedgerEntryType["CREDIT"] = "credit";
})(LedgerEntryType || (LedgerEntryType = {}));
let LedgerEntry = class LedgerEntry {
    id;
    transactionId;
    transaction;
    accountId;
    account;
    type;
    amount;
    currency;
    description;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], LedgerEntry.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], LedgerEntry.prototype, "transactionId", void 0);
__decorate([
    ManyToOne('Transaction', (transaction) => transaction.ledgerEntries, {
        nullable: false,
        onDelete: 'RESTRICT',
    }),
    JoinColumn({ name: 'transactionId' }),
    __metadata("design:type", Function)
], LedgerEntry.prototype, "transaction", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], LedgerEntry.prototype, "accountId", void 0);
__decorate([
    ManyToOne('Account', (account) => account.ledgerEntries, {
        nullable: false,
        onDelete: 'RESTRICT',
    }),
    JoinColumn({ name: 'accountId' }),
    __metadata("design:type", Function)
], LedgerEntry.prototype, "account", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: LedgerEntryType,
    }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "type", void 0);
__decorate([
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "amount", void 0);
__decorate([
    Column({ length: 3 }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "currency", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], LedgerEntry.prototype, "description", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], LedgerEntry.prototype, "createdAt", void 0);
LedgerEntry = __decorate([
    Entity('ledger_entries'),
    Index(['transactionId']),
    Index(['accountId'])
], LedgerEntry);
export { LedgerEntry };
//# sourceMappingURL=ledger-entry.entity.js.map