import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

import { ReconciliationService } from './reconciliation.service.js';

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('reconciliation')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(
    private readonly reconciliationService:
      ReconciliationService,
  ) {}

  @Post()
  reconcile(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId')
    organizationId: string,
  ) {
    return this.reconciliationService.reconcile(
      request.user.sub,
      organizationId,
    );
  }

  @Get()
  findRuns(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId')
    organizationId: string,
  ) {
    return this.reconciliationService.findRunsForUser(
      request.user.sub,
      organizationId,
    );
  }

  @Get(':id')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') runId: string,
  ) {
    const run =
      await this.reconciliationService.getRun(
        runId,
      );

    if (!run) {
      return {
        found: false,
      };
    }

    return run;
  }
}
