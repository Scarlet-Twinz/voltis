import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';

import { RiskAssessment } from './risk-assessment.entity.js';
import { RiskController } from './risk.controller.js';
import { RiskService } from './risk.service.js';

@Module({
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
export class RiskModule {}
