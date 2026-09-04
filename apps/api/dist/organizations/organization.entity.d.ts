import type { User } from '../users/user.entity.js';
import type { Account } from '../accounts/account.entity.js';
export declare class Organization {
    id: string;
    name: string;
    slug: string;
    defaultCurrency: string;
    isActive: boolean;
    owner: User;
    ownerId: string;
    accounts: Account[];
    createdAt: Date;
    updatedAt: Date;
}
