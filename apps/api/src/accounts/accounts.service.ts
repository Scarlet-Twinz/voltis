import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from '../organizations/organization.entity.js';
import { Account } from './account.entity.js';
import { CreateAccountDto } from './dto/create-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,

    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
  ) {}

  async create(userId: string, dto: CreateAccountDto) {
    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: dto.organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const code = dto.code.trim();
    const currency = dto.currency.trim().toUpperCase();

    const existingAccount =
      await this.accountsRepository.findOne({
        where: {
          organizationId: organization.id,
          code,
        },
      });

    if (existingAccount) {
      throw new ConflictException(
        'An account with this code already exists in the organization',
      );
    }

    if (currency !== organization.defaultCurrency) {
      throw new ConflictException(
        `Account currency must match the organization's default currency (${organization.defaultCurrency})`,
      );
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

    const savedAccount =
      await this.accountsRepository.save(account);

    return this.sanitizeAccount(savedAccount);
  }

  async findAllForUser(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const accounts =
      await this.accountsRepository.find({
        where: {
          organizationId,
          isActive: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    return accounts.map((account) =>
      this.sanitizeAccount(account),
    );
  }

  async findOneForUser(
    userId: string,
    accountId: string,
  ) {
    const account =
      await this.accountsRepository.findOne({
        where: {
          id: accountId,
          isActive: true,
        },
        relations: {
          organization: true,
        },
      });

    if (
      !account ||
      account.organization.ownerId !== userId ||
      !account.organization.isActive
    ) {
      throw new NotFoundException(
        'Account not found',
      );
    }

    return this.sanitizeAccount(account);
  }

  private sanitizeAccount(account: Account) {
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
}
