import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { ReconciliationDiscrepancy } from './reconciliation-discrepancy.entity.js';

export enum ReconciliationStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('reconciliation_runs')
export class ReconciliationRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @Column({
    type: 'enum',
    enum: ReconciliationStatus,
    default: ReconciliationStatus.RUNNING,
  })
  status!: ReconciliationStatus;

  @Column({ type: 'integer', default: 0 })
  paymentsChecked!: number;

  @Column({ type: 'integer', default: 0 })
  transactionsChecked!: number;

  @Column({ type: 'integer', default: 0 })
  ledgerEntriesChecked!: number;

  @Column({ type: 'integer', default: 0 })
  matchedCount!: number;

  @Column({ type: 'integer', default: 0 })
  discrepancyCount!: number;

  @Column({ type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @OneToMany(
    'ReconciliationDiscrepancy',
    (discrepancy: ReconciliationDiscrepancy) =>
      discrepancy.run,
  )
  discrepancies!: ReconciliationDiscrepancy[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
