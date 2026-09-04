var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, } from 'typeorm';
export var ReconciliationStatus;
(function (ReconciliationStatus) {
    ReconciliationStatus["RUNNING"] = "running";
    ReconciliationStatus["COMPLETED"] = "completed";
    ReconciliationStatus["FAILED"] = "failed";
})(ReconciliationStatus || (ReconciliationStatus = {}));
let ReconciliationRun = class ReconciliationRun {
    id;
    organizationId;
    status;
    paymentsChecked;
    transactionsChecked;
    ledgerEntriesChecked;
    matchedCount;
    discrepancyCount;
    failureReason;
    completedAt;
    discrepancies;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ReconciliationRun.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], ReconciliationRun.prototype, "organizationId", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: ReconciliationStatus,
        default: ReconciliationStatus.RUNNING,
    }),
    __metadata("design:type", String)
], ReconciliationRun.prototype, "status", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "paymentsChecked", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "transactionsChecked", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "ledgerEntriesChecked", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "matchedCount", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "discrepancyCount", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationRun.prototype, "failureReason", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationRun.prototype, "completedAt", void 0);
__decorate([
    OneToMany('ReconciliationDiscrepancy', (discrepancy) => discrepancy.run),
    __metadata("design:type", Array)
], ReconciliationRun.prototype, "discrepancies", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ReconciliationRun.prototype, "createdAt", void 0);
ReconciliationRun = __decorate([
    Entity('reconciliation_runs')
], ReconciliationRun);
export { ReconciliationRun };
//# sourceMappingURL=reconciliation-run.entity.js.map