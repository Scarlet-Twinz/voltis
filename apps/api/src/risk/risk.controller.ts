import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

import { RiskService } from './risk.service.js';

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('risk')
@UseGuards(JwtAuthGuard)
export class RiskController {
  constructor(
    private readonly riskService: RiskService,
  ) {}

  @Get('payments/:paymentId')
  findForPayment(
    @Req() request: AuthenticatedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.riskService.findForPayment(
      request.user.sub,
      paymentId,
    );
  }

  @Get()
  findForOrganization(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.riskService.findForOrganization(
      request.user.sub,
      organizationId,
    );
  }
}
