import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { PaymentMethod } from '../payment.entity.js';

export class CreatePaymentDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  debitAccountId!: string;

  @IsUUID()
  creditAccountId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsString()
  @Matches(/^[0-9]+$/, {
    message:
      'amount must be a positive integer in minor currency units',
  })
  amount!: string;

  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message:
      'currency must be a valid 3-letter uppercase currency code',
  })
  currency!: string;

  @IsString()
  @MaxLength(255)
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}