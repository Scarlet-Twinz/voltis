import type { Organization } from '../organizations/organization.entity.js';
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    organizations: Organization[];
    createdAt: Date;
    updatedAt: Date;
}
