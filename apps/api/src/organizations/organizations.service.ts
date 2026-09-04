import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from './organization.entity.js';
import { User } from '../users/user.entity.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    userId: string,
    dto: CreateOrganizationDto,
  ) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const slug = dto.slug.trim().toLowerCase();

    const existingOrganization =
      await this.organizationsRepository.findOne({
        where: {
          slug,
        },
      });

    if (existingOrganization) {
      throw new ConflictException(
        'An organization with this slug already exists',
      );
    }

    const organization =
      this.organizationsRepository.create({
        name: dto.name.trim(),
        slug,
        defaultCurrency: dto.defaultCurrency
          .trim()
          .toUpperCase(),
        ownerId: user.id,
        owner: user,
        isActive: true,
      });

    return this.organizationsRepository.save(
      organization,
    );
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

  async findOneForUser(
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

    return organization;
  }
}