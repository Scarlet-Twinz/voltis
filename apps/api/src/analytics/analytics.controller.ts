import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AnalyticsService } from './analytics.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('overview')
  getOverview(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.analyticsService.getOverview(
      request.user.sub,
      organizationId,
    );
  }

  @Get('payments')
  getPayments(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.analyticsService.getPayments(
      request.user.sub,
      organizationId,
    );
  }

  @Get('transactions')
  getTransactions(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.analyticsService.getTransactions(
      request.user.sub,
      organizationId,
    );
  }

  @Get('risk')
  getRisk(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.analyticsService.getRisk(
      request.user.sub,
      organizationId,
    );
  }

  @Get('accounts')
  getAccounts(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.analyticsService.getAccounts(
      request.user.sub,
      organizationId,
    );
  }
}
