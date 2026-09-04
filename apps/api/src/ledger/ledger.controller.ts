import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { LedgerService } from './ledger.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
  ) {}

  @Post('entries')
  createEntry(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateLedgerEntryDto,
  ) {
    return this.ledgerService.createEntry(
      request.user.sub,
      dto,
    );
  }

  @Get('transactions/:transactionId')
  findByTransaction(
    @Req() request: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
  ) {
    return this.ledgerService.findByTransaction(
      request.user.sub,
      transactionId,
    );
  }
}
