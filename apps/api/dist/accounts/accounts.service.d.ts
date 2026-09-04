import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Account } from './account.entity.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
export declare class AccountsService {
    private readonly accountsRepository;
    private readonly organizationsRepository;
    constructor(accountsRepository: Repository<Account>, organizationsRepository: Repository<Organization>);
    create(userId: string, dto: CreateAccountDto): Promise<{
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
    findAllForUser(userId: string, organizationId: string): Promise<{
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
    findOneForUser(userId: string, accountId: string): Promise<{
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
    private sanitizeAccount;
}
