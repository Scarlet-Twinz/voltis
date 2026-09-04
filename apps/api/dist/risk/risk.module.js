var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { RiskAssessment } from './risk-assessment.entity.js';
import { RiskController } from './risk.controller.js';
import { RiskService } from './risk.service.js';
let RiskModule = class RiskModule {
};
RiskModule = __decorate([
    Module({
        imports: [
            AuthModule,
            TypeOrmModule.forFeature([
                RiskAssessment,
                Organization,
                Payment,
            ]),
        ],
        controllers: [
            RiskController,
        ],
        providers: [
            RiskService,
        ],
        exports: [
            RiskService,
        ],
    })
], RiskModule);
export { RiskModule };
//# sourceMappingURL=risk.module.js.map