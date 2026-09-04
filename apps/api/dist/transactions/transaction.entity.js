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
export var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["PROCESSING"] = "processing";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["REVERSED"] = "reversed";
})(TransactionStatus || (TransactionStatus = {}));
export var TransactionType;
(function (TransactionType) {
    TransactionType["PAYMENT"] = "payment";
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["REFUND"] = "refund";
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["FEE"] = "fee";
    TransactionType["ADJUSTMENT"] = "adjustment";
})(TransactionType || (TransactionType = {}));
let Transaction = class Transaction {
    id;
    organizationId;
    reference;
    type;
    status;
    amount;
    currency;
    description;
    metadata;
    processedAt;
    ledgerEntries;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], Transaction.prototype, "organizationId", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Transaction.prototype, "reference", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: TransactionType,
    }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], Transaction.prototype, "amount", void 0);
__decorate([
    Column({ length: 3 }),
    __metadata("design:type", String)
], Transaction.prototype, "currency", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "description", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "metadata", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "processedAt", void 0);
__decorate([
    OneToMany('LedgerEntry', (entry) => entry.transaction),
    __metadata("design:type", Array)
], Transaction.prototype, "ledgerEntries", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
Transaction = __decorate([
    Entity('transactions'),
    Index(['organizationId', 'reference'], { unique: true })
], Transaction);
export { Transaction };
//# sourceMappingURL=transaction.entity.js.map