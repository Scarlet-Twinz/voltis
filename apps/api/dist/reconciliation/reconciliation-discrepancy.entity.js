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
export var ReconciliationDiscrepancyType;
(function (ReconciliationDiscrepancyType) {
    ReconciliationDiscrepancyType["MISSING_TRANSACTION"] = "missing_transaction";
    ReconciliationDiscrepancyType["TRANSACTION_NOT_FOUND"] = "transaction_not_found";
    ReconciliationDiscrepancyType["AMOUNT_MISMATCH"] = "amount_mismatch";
    ReconciliationDiscrepancyType["CURRENCY_MISMATCH"] = "currency_mismatch";
    ReconciliationDiscrepancyType["STATUS_MISMATCH"] = "status_mismatch";
    ReconciliationDiscrepancyType["MISSING_LEDGER_ENTRIES"] = "missing_ledger_entries";
    ReconciliationDiscrepancyType["UNBALANCED_LEDGER"] = "unbalanced_ledger";
    ReconciliationDiscrepancyType["TRANSACTION_LEDGER_AMOUNT_MISMATCH"] = "transaction_ledger_amount_mismatch";
})(ReconciliationDiscrepancyType || (ReconciliationDiscrepancyType = {}));
let ReconciliationDiscrepancy = class ReconciliationDiscrepancy {
    id;
    runId;
    run;
    organizationId;
    type;
    paymentId;
    transactionId;
    message;
    details;
    resolved;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ReconciliationDiscrepancy.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], ReconciliationDiscrepancy.prototype, "runId", void 0);
__decorate([
    ManyToOne('ReconciliationRun', (run) => run.discrepancies, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'runId' }),
    __metadata("design:type", Function)
], ReconciliationDiscrepancy.prototype, "run", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], ReconciliationDiscrepancy.prototype, "organizationId", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: ReconciliationDiscrepancyType,
    }),
    __metadata("design:type", String)
], ReconciliationDiscrepancy.prototype, "type", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationDiscrepancy.prototype, "paymentId", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationDiscrepancy.prototype, "transactionId", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], ReconciliationDiscrepancy.prototype, "message", void 0);
__decorate([
    Column({
        type: 'jsonb',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ReconciliationDiscrepancy.prototype, "details", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], ReconciliationDiscrepancy.prototype, "resolved", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ReconciliationDiscrepancy.prototype, "createdAt", void 0);
ReconciliationDiscrepancy = __decorate([
    Entity('reconciliation_discrepancies'),
    Index(['runId']),
    Index(['organizationId'])
], ReconciliationDiscrepancy);
export { ReconciliationDiscrepancy };
//# sourceMappingURL=reconciliation-discrepancy.entity.js.map