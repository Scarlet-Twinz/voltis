import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto.js';
import { WebhooksService } from './webhooks.service.js';

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(
    private readonly webhooksService:
      WebhooksService,
  ) {}

  @Post('endpoints')
  createEndpoint(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId')
    organizationId: string,
    @Body()
    dto: CreateWebhookEndpointDto,
  ) {
    return this.webhooksService.createEndpoint(
      request.user.sub,
      organizationId,
      dto,
    );
  }

  @Get('endpoints')
  findEndpoints(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId')
    organizationId: string,
  ) {
    return this.webhooksService.findEndpointsForUser(
      request.user.sub,
      organizationId,
    );
  }

  @Delete('endpoints/:id')
  removeEndpoint(
    @Req() request: AuthenticatedRequest,
    @Param('id') endpointId: string,
  ) {
    return this.webhooksService.removeEndpoint(
      request.user.sub,
      endpointId,
    );
  }

  @Get('deliveries')
  findDeliveries(
    @Req() request: AuthenticatedRequest,
    @Query('organizationId')
    organizationId: string,
  ) {
    return this.webhooksService.findDeliveriesForUser(
      request.user.sub,
      organizationId,
    );
  }
}
