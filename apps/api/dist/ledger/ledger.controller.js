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
import { Body, Controller, Get, Param, Post, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { LedgerService } from './ledger.service.js';
let LedgerController = class LedgerController {
    ledgerService;
    constructor(ledgerService) {
        this.ledgerService = ledgerService;
    }
    createEntry(request, dto) {
        return this.ledgerService.createEntry(request.user.sub, dto);
    }
    findByTransaction(request, transactionId) {
        return this.ledgerService.findByTransaction(request.user.sub, transactionId);
    }
};
__decorate([
    Post('entries'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateLedgerEntryDto]),
    __metadata("design:returntype", void 0)
], LedgerController.prototype, "createEntry", null);
__decorate([
    Get('transactions/:transactionId'),
    __param(0, Req()),
    __param(1, Param('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LedgerController.prototype, "findByTransaction", null);
LedgerController = __decorate([
    Controller('ledger'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [LedgerService])
], LedgerController);
export { LedgerController };
//# sourceMappingURL=ledger.controller.js.map