import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Account } from '../accounts/account.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../users/user.entity.js';
import { Organization } from './organization.entity.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Organization,
      User,
      Account,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
