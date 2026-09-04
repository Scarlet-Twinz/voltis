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
import { ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Account } from './account.entity.js';
let AccountsService = class AccountsService {
    accountsRepository;
    organizationsRepository;
    constructor(accountsRepository, organizationsRepository) {
        this.accountsRepository = accountsRepository;
        this.organizationsRepository = organizationsRepository;
    }
    async create(userId, dto) {
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: dto.organizationId,
                ownerId: userId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }
        const code = dto.code.trim();
        const currency = dto.currency.trim().toUpperCase();
        const existingAccount = await this.accountsRepository.findOne({
            where: {
                organizationId: organization.id,
                code,
            },
        });
        if (existingAccount) {
            throw new ConflictException('An account with this code already exists in the organization');
        }
        if (currency !== organization.defaultCurrency) {
            throw new ConflictException(`Account currency must match the organization's default currency (${organization.defaultCurrency})`);
        }
        const account = this.accountsRepository.create({
            organizationId: organization.id,
            organization,
            code,
            name: dto.name.trim(),
            type: dto.type,
            currency,
            balance: '0',
            isActive: true,
        });
        const savedAccount = await this.accountsRepository.save(account);
        return this.sanitizeAccount(savedAccount);
    }
    async findAllForUser(userId, organizationId) {
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: organizationId,
                ownerId: userId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }
        const accounts = await this.accountsRepository.find({
            where: {
                organizationId,
                isActive: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
        return accounts.map((account) => this.sanitizeAccount(account));
    }
    async findOneForUser(userId, accountId) {
        const account = await this.accountsRepository.findOne({
            where: {
                id: accountId,
                isActive: true,
            },
            relations: {
                organization: true,
            },
        });
        if (!account ||
            account.organization.ownerId !== userId ||
            !account.organization.isActive) {
            throw new NotFoundException('Account not found');
        }
        return this.sanitizeAccount(account);
    }
    sanitizeAccount(account) {
        return {
            id: account.id,
            organizationId: account.organizationId,
            code: account.code,
            name: account.name,
            type: account.type,
            currency: account.currency,
            balance: account.balance,
            isActive: account.isActive,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }
};
AccountsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Account)),
    __param(1, InjectRepository(Organization)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], AccountsService);
export { AccountsService };
//# sourceMappingURL=accounts.service.js.map