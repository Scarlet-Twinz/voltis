import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { LedgerEntryType } from '../ledger-entry.entity.js';

export class CreateLedgerEntryDto {
  @IsUUID()
  transactionId!: string;

  @IsUUID()
  accountId!: string;

  @IsEnum(LedgerEntryType)
  type!: LedgerEntryType;

  @IsString()
  @Matches(/^[0-9]+$/, {
    message: 'amount must be a positive integer in minor currency units',
  })
  amount!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid 3-letter uppercase currency code',
  })
  currency!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;
}
