import { AccountType } from '../account.entity.js';
export declare class CreateAccountDto {
    organizationId: string;
    code: string;
    name: string;
    type: AccountType;
    currency: string;
}
