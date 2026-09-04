import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Organization } from '../organizations/organization.entity.js';
import type { LedgerEntry } from '../ledger/ledger-entry.entity.js';

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

@Entity('accounts')
@Index(['organizationId', 'code'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @ManyToOne('Organization', (organization: Organization) => organization.accounts, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ length: 50 })
  code!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: 'bigint', default: 0 })
  balance!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany('LedgerEntry', (entry: LedgerEntry) => entry.account)
  ledgerEntries!: LedgerEntry[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}