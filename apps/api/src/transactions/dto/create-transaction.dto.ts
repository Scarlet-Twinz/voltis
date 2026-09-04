import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TransactionType } from '../transaction.entity.js';

export class CreateTransactionDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  debitAccountId!: string;

  @IsUUID()
  creditAccountId!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsString()
  @Matches(/^[0-9]+$/, {
    message:
      'amount must be a positive integer in minor currency units',
  })
  amount!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @Matches(/^[A-Z]{3}$/, {
    message:
      'currency must be a valid 3-letter uppercase currency code',
  })
  currency!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
