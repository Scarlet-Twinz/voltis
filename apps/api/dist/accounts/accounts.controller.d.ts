import type { Request } from 'express';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { AccountsService } from './accounts.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    create(request: AuthenticatedRequest, dto: CreateAccountDto): Promise<{
        id: string;
        organizationId: string;
        code: string;
        name: string;
        type: import("./account.entity.js").AccountType;
        currency: string;
        balance: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(request: AuthenticatedRequest, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        code: string;
        name: string;
        type: import("./account.entity.js").AccountType;
        currency: string;
        balance: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(request: AuthenticatedRequest, accountId: string): Promise<{
        id: string;
        organizationId: string;
        code: string;
        name: string;
        type: import("./account.entity.js").AccountType;
        currency: string;
        balance: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
