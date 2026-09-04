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
import { Organization } from './organization.entity.js';
import { User } from '../users/user.entity.js';
let OrganizationsService = class OrganizationsService {
    organizationsRepository;
    usersRepository;
    constructor(organizationsRepository, usersRepository) {
        this.organizationsRepository = organizationsRepository;
        this.usersRepository = usersRepository;
    }
    async create(userId, dto) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const slug = dto.slug.trim().toLowerCase();
        const existingOrganization = await this.organizationsRepository.findOne({
            where: {
                slug,
            },
        });
        if (existingOrganization) {
            throw new ConflictException('An organization with this slug already exists');
        }
        const organization = this.organizationsRepository.create({
            name: dto.name.trim(),
            slug,
            defaultCurrency: dto.defaultCurrency
                .trim()
                .toUpperCase(),
            ownerId: user.id,
            owner: user,
            isActive: true,
        });
        return this.organizationsRepository.save(organization);
    }
    async findAllForUser(userId) {
        return this.organizationsRepository.find({
            where: {
                ownerId: userId,
                isActive: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async findOneForUser(userId, organizationId) {
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
        return organization;
    }
};
OrganizationsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Organization)),
    __param(1, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], OrganizationsService);
export { OrganizationsService };
//# sourceMappingURL=organizations.service.js.map