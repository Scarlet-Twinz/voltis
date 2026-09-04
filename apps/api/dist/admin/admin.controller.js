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
import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminService } from './admin.service.js';
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getDashboard(request, organizationId) {
        return this.adminService.getDashboard(request.user.sub, organizationId);
    }
    listUsers(request, organizationId) {
        return this.adminService.listUsers(request.user.sub, organizationId);
    }
    listPayments(request, organizationId) {
        return this.adminService.listPayments(request.user.sub, organizationId);
    }
    listTransactions(request, organizationId) {
        return this.adminService.listTransactions(request.user.sub, organizationId);
    }
    listAccounts(request, organizationId) {
        return this.adminService.listAccounts(request.user.sub, organizationId);
    }
    listRiskAssessments(request, organizationId) {
        return this.adminService.listRiskAssessments(request.user.sub, organizationId);
    }
    listReconciliation(request, organizationId) {
        return this.adminService.listReconciliation(request.user.sub, organizationId);
    }
    listWebhooks(request, organizationId) {
        return this.adminService.listWebhooks(request.user.sub, organizationId);
    }
    setOrganizationStatus(request, organizationId, body) {
        return this.adminService.setOrganizationStatus(request.user.sub, organizationId, body.isActive);
    }
    setUserStatus(request, organizationId, targetUserId, body) {
        return this.adminService.setUserStatus(request.user.sub, organizationId, targetUserId, body.isActive);
    }
};
__decorate([
    Get('dashboard'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
__decorate([
    Get('users'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    Get('payments'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listPayments", null);
__decorate([
    Get('transactions'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listTransactions", null);
__decorate([
    Get('accounts'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listAccounts", null);
__decorate([
    Get('risk'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listRiskAssessments", null);
__decorate([
    Get('reconciliation'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listReconciliation", null);
__decorate([
    Get('webhooks'),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listWebhooks", null);
__decorate([
    Patch('organizations/:organizationId/status'),
    __param(0, Req()),
    __param(1, Param('organizationId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setOrganizationStatus", null);
__decorate([
    Patch('organizations/:organizationId/users/:userId/status'),
    __param(0, Req()),
    __param(1, Param('organizationId')),
    __param(2, Param('userId')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setUserStatus", null);
AdminController = __decorate([
    Controller('admin'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [AdminService])
], AdminController);
export { AdminController };
//# sourceMappingURL=admin.controller.js.map