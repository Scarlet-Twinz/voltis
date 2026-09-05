import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

interface ProcessPaymentBody {
  paymentId: string;
  organizationId: string;
  attempt?: number;
  maxAttempts?: number;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(request.user.sub, dto);
  }

  @Post('process-internal')
  processInternal(
    @Headers('x-voltis-worker-secret') workerSecret: string | undefined,
    @Body() body: ProcessPaymentBody,
  ) {
    const configuredSecret = process.env.WORKER_SECRET;
    const expectedSecret =
      configuredSecret ||
      (process.env.NODE_ENV === 'production'
        ? ''
        : 'voltis-worker-development-secret');

    if (!expectedSecret || !workerSecret || workerSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid worker credentials');
    }

    return this.paymentsService.processQueuedPayment(
      body.paymentId,
      body.organizationId,
      body.attempt ?? 1,
      body.maxAttempts ?? 3,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.paymentsService.findAllForUser(
      request.user.sub,
      organizationId,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') paymentId: string,
  ) {
    return this.paymentsService.findOneForUser(
      request.user.sub,
      paymentId,
    );
  }
}
