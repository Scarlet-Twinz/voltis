import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CASH = 'cash',
}

@Entity('payments')
@Index(['organizationId', 'reference'], { unique: true })
@Index(['organizationId', 'idempotencyKey'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @Column({ length: 100 })
  reference!: string;

  @Column({ length: 255 })
  idempotencyKey!: string;

  @Column({ length: 64 })
  requestFingerprint!: string;

  @Column('uuid', { nullable: true })
  transactionId!: string | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method!: PaymentMethod;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  processorReference!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  failureReason!: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  processedAt!: Date | null;
}