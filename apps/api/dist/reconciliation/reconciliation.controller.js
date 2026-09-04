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
import { Controller, Get, Param, Post, Query, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ReconciliationService } from './reconciliation.service.js';
let ReconciliationController = class ReconciliationController {
    reconciliationService;
    constructor(reconciliationService) {
        this.reconciliationService = reconciliationService;
    }
    reconcile(request, organizationId) {
        return this.reconciliationService.reconcile(request.user.sub, organizationId);
    }
    findRuns(request, organizationId) {
        return this.reconciliationService.findRunsForUser(request.user.sub, organizationId);
    }
    async findOne(request, runId) {
        const run = await this.reconciliationService.getRun(runId);
        if (!run) {
            return {
                found: false,
            };
        }
        return run;
    }
};
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReconciliationController.prototype, "reconcile", null);
__decorate([
    Get(),
    __param(0, Req()),
    __param(1, Query('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReconciliationController.prototype, "findRuns", null);
__decorate([
    Get(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "findOne", null);
ReconciliationController = __decorate([
    Controller('reconciliation'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [ReconciliationService])
], ReconciliationController);
export { ReconciliationController };
//# sourceMappingURL=reconciliation.controller.js.map