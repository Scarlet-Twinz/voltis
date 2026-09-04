var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, } from 'typeorm';
export var RiskDecision;
(function (RiskDecision) {
    RiskDecision["ALLOW"] = "allow";
    RiskDecision["REVIEW"] = "review";
    RiskDecision["BLOCK"] = "block";
})(RiskDecision || (RiskDecision = {}));
let RiskAssessment = class RiskAssessment {
    id;
    organizationId;
    paymentId;
    score;
    decision;
    signals;
    explanation;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], RiskAssessment.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], RiskAssessment.prototype, "organizationId", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], RiskAssessment.prototype, "paymentId", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], RiskAssessment.prototype, "score", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: RiskDecision,
    }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "decision", void 0);
__decorate([
    Column({
        type: 'jsonb',
    }),
    __metadata("design:type", Object)
], RiskAssessment.prototype, "signals", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RiskAssessment.prototype, "explanation", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], RiskAssessment.prototype, "createdAt", void 0);
RiskAssessment = __decorate([
    Entity('risk_assessments'),
    Index(['organizationId']),
    Index(['paymentId'])
], RiskAssessment);
export { RiskAssessment };
//# sourceMappingURL=risk-assessment.entity.js.map