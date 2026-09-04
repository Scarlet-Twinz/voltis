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
import { Controller, Get, Query, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AnalyticsService } from './analytics.service.js';
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getOverview(request, organizationId) {
        return this.analyticsService.getOverview(request.user.sub, organizationId);
    }
    getPayments(request, organizationId) {
        return this.analyticsService.getPayments(request.user.sub, organizationId);
    }
    getTransactions(request, organizationId) {
        return this.analyticsService.getTransactions(request.user.sub, organizationId);
    }
    getRisk(request, organizationId) {
        return this.analyticsService.getRisk(request.user.sub, organizationId);
    }
    getAccounts(request, organizationId) {
        return this.analyticsService.getAccounts(request.user.sub, organizationId);
    }
};
__decorate([
    Get('overview'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getOverview", null);
__decorate([
    Get('payments'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getPayments", null);
__decorate([
    Get('transactions'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTransactions", null);
__decorate([
    Get('risk'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getRisk", null);
__decorate([
    Get('accounts'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getAccounts", null);
AnalyticsController = __decorate([
    Controller('analytics'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [AnalyticsService])
], AnalyticsController);
export { AnalyticsController };
//# sourceMappingURL=analytics.controller.js.map