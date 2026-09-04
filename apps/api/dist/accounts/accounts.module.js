var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Organization } from '../organizations/organization.entity.js';
import { Account } from './account.entity.js';
import { AccountsController } from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';
let AccountsModule = class AccountsModule {
};
AccountsModule = __decorate([
    Module({
        imports: [
            AuthModule,
            TypeOrmModule.forFeature([
                Account,
                Organization,
            ]),
        ],
        controllers: [AccountsController],
        providers: [AccountsService],
        exports: [AccountsService],
    })
], AccountsModule);
export { AccountsModule };
//# sourceMappingURL=accounts.module.js.map