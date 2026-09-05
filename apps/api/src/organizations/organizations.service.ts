import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity.js';
import { Account } from '../accounts/account.entity.js';
import { Organization } from './organization.entity.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const slug = dto.slug.trim().toLowerCase();

    const existingOrganization = await this.organizationsRepository.findOne({
      where: { slug },
    });

    if (existingOrganization) {
      throw new ConflictException(
        'An organization with this slug already exists',
      );
    }

    const organization = this.organizationsRepository.create({
      name: dto.name.trim(),
      slug,
      defaultCurrency: dto.defaultCurrency.trim().toUpperCase(),
      ownerId: user.id,
      owner: user,
      isActive: true,
    });

    return this.organizationsRepository.save(organization);
  }

  async findAllForUser(userId: string) {
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

  async findOneForUser(userId: string, organizationId: string) {
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

  async updateForUser(
    userId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ) {
    const organization = await this.findOneForUser(userId, organizationId);

    if (dto.slug !== undefined) {
      const slug = dto.slug.trim().toLowerCase();

      if (slug !== organization.slug) {
        const existing = await this.organizationsRepository.findOne({
          where: { slug },
        });

        if (existing && existing.id !== organization.id) {
          throw new ConflictException(
            'An organization with this slug already exists',
          );
        }

        organization.slug = slug;
      }
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name.length < 2) {
        throw new ConflictException('Organization name cannot be empty');
      }
      organization.name = name;
    }

    if (dto.defaultCurrency !== undefined) {
      const currency = dto.defaultCurrency.trim().toUpperCase();

      if (currency !== organization.defaultCurrency) {
        const accounts = await this.accountsRepository.find({
          where: {
            organizationId: organization.id,
            isActive: true,
          },
          select: ['id', 'code', 'currency'],
        });

        const incompatible = accounts.find(
          (account) => account.currency !== currency,
        );

        if (incompatible) {
          throw new ConflictException(
            `Cannot change organization currency while account ${incompatible.code} uses ${incompatible.currency}. Create or migrate accounts before changing the default currency.`,
          );
        }

        organization.defaultCurrency = currency;
      }
    }

    return this.organizationsRepository.save(organization);
  }
}
