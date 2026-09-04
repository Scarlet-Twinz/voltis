import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminService } from './admin.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard')
  getDashboard(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.getDashboard(
      request.user.sub,
      organizationId,
    );
  }

  @Get('users')
  listUsers(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.listUsers(
      request.user.sub,
      organizationId,
    );
  }

  @Get('payments')
  listPayments(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.listPayments(
      request.user.sub,
      organizationId,
    );
  }

  @Get('transactions')
  listTransactions(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.listTransactions(
      request.user.sub,
      organizationId,
    );
  }

  @Get('accounts')
  listAccounts(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.listAccounts(
      request.user.sub,
      organizationId,
    );
  }

  @Get('risk')
  listRiskAssessments(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.listRiskAssessments(
      request.user.sub,
      organizationId,
    );
  }

  @Get('reconciliation')
  listReconciliation(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.listReconciliation(
      request.user.sub,
      organizationId,
    );
  }

  @Get('webhooks')
  listWebhooks(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.adminService.listWebhooks(
      request.user.sub,
      organizationId,
    );
  }

  @Patch('organizations/:organizationId/status')
  setOrganizationStatus(
    @Req() request: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.setOrganizationStatus(
      request.user.sub,
      organizationId,
      body.isActive,
    );
  }

  @Patch(
    'organizations/:organizationId/users/:userId/status',
  )
  setUserStatus(
    @Req() request: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.setUserStatus(
      request.user.sub,
      organizationId,
      targetUserId,
      body.isActive,
    );
  }
}
