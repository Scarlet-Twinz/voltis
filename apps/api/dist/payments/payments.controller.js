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
import { Body, Controller, Get, Headers, Param, Post, Query, Req, UnauthorizedException, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    create(request, dto) {
        return this.paymentsService.create(request.user.sub, dto);
    }
    processInternal(workerSecret, body) {
        const expectedSecret = process.env.WORKER_SECRET ??
            'voltis-worker-development-secret';
        if (!workerSecret ||
            workerSecret !== expectedSecret) {
            throw new UnauthorizedException('Invalid worker credentials');
        }
        return this.paymentsService.processQueuedPayment(body.paymentId, body.organizationId, body.attempt ?? 1, body.maxAttempts ?? 3);
    }
    findAll(request, organizationId) {
        return this.paymentsService.findAllForUser(request.user.sub, organizationId);
    }
    findOne(request, paymentId) {
        return this.paymentsService.findOneForUser(request.user.sub, paymentId);
    }
};
__decorate([
    Post(),
    UseGuards(JwtAuthGuard),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "create", null);
__decorate([
    Post('process-internal'),
    __param(0, Headers('x-voltis-worker-secret')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "processInternal", null);
__decorate([
    Get(),
    UseGuards(JwtAuthGuard),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    UseGuards(JwtAuthGuard),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
PaymentsController = __decorate([
    Controller('payments'),
    __metadata("design:paramtypes", [PaymentsService])
], PaymentsController);
export { PaymentsController };
//# sourceMappingURL=payments.controller.js.map