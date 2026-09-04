import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { ReconciliationRun } from './reconciliation-run.entity.js';

export enum ReconciliationDiscrepancyType {
  MISSING_TRANSACTION = 'missing_transaction',
  TRANSACTION_NOT_FOUND = 'transaction_not_found',
  AMOUNT_MISMATCH = 'amount_mismatch',
  CURRENCY_MISMATCH = 'currency_mismatch',
  STATUS_MISMATCH = 'status_mismatch',
  MISSING_LEDGER_ENTRIES = 'missing_ledger_entries',
  UNBALANCED_LEDGER = 'unbalanced_ledger',
  TRANSACTION_LEDGER_AMOUNT_MISMATCH =
    'transaction_ledger_amount_mismatch',
}

@Entity('reconciliation_discrepancies')
@Index(['runId'])
@Index(['organizationId'])
export class ReconciliationDiscrepancy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  runId!: string;

  @ManyToOne(
    'ReconciliationRun',
    (run: ReconciliationRun) =>
      run.discrepancies,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'runId' })
  run!: ReconciliationRun;

  @Column('uuid')
  organizationId!: string;

  @Column({
    type: 'enum',
    enum: ReconciliationDiscrepancyType,
  })
  type!: ReconciliationDiscrepancyType;

  @Column({ type: 'uuid', nullable: true })
  paymentId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  transactionId!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  details!: Record<string, unknown> | null;

  @Column({ default: false })
  resolved!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
