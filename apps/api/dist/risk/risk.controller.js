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
import { Controller, Get, Param, Query, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RiskService } from './risk.service.js';
let RiskController = class RiskController {
    riskService;
    constructor(riskService) {
        this.riskService = riskService;
    }
    findForPayment(paymentId) {
        return this.riskService.findForPayment(paymentId);
    }
    findForOrganization(request, organizationId) {
        return this.riskService.findForOrganization(request.user.sub, organizationId);
    }
};
__decorate([
    Get('payments/:paymentId'),
    __param(0, Param('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RiskController.prototype, "findForPayment", null);
__decorate([
    Get(),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RiskController.prototype, "findForOrganization", null);
RiskController = __decorate([
    Controller('risk'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [RiskService])
], RiskController);
export { RiskController };
//# sourceMappingURL=risk.controller.js.map