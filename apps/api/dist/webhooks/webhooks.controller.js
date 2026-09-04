var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto.js';
import { WebhooksService } from './webhooks.service.js';
let WebhooksController = class WebhooksController {
    webhooksService;
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    createEndpoint(request, organizationId, dto) {
        return this.webhooksService.createEndpoint(request.user.sub, organizationId, dto);
    }
    findEndpoints(request, organizationId) {
        return this.webhooksService.findEndpointsForUser(request.user.sub, organizationId);
    }
    removeEndpoint(request, endpointId) {
        return this.webhooksService.removeEndpoint(request.user.sub, endpointId);
    }
    findDeliveries(request, organizationId) {
        return this.webhooksService.findDeliveriesForUser(request.user.sub, organizationId);
    }
};
__decorate([
    Post('endpoints'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CreateWebhookEndpointDto]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "createEndpoint", null);
__decorate([
    Get('endpoints'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "findEndpoints", null);
__decorate([
    Delete('endpoints/:id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "removeEndpoint", null);
__decorate([
    Get('deliveries'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "findDeliveries", null);
WebhooksController = __decorate([
    Controller('webhooks'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [WebhooksService])
], WebhooksController);
export { WebhooksController };
//# sourceMappingURL=webhooks.controller.js.map