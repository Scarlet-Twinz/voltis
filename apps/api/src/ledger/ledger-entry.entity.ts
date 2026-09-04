import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Account } from '../accounts/account.entity.js';
import type { Transaction } from '../transactions/transaction.entity.js';

export enum LedgerEntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('ledger_entries')
@Index(['transactionId'])
@Index(['accountId'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  transactionId!: string;

  @ManyToOne(
    'Transaction',
    (transaction: Transaction) => transaction.ledgerEntries,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;

  @Column('uuid')
  accountId!: string;

  @ManyToOne('Account', (account: Account) => account.ledgerEntries, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column({
    type: 'enum',
    enum: LedgerEntryType,
  })
  type!: LedgerEntryType;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}