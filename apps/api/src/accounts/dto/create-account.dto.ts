import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

import { AccountType } from '../account.entity.js';

export class CreateAccountDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'code must contain only letters, numbers, underscores, and hyphens',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message:
      'currency must be a valid 3-letter uppercase currency code',
  })
  currency!: string;
}
