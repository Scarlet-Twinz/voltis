import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum RiskDecision {
  ALLOW = 'allow',
  REVIEW = 'review',
  BLOCK = 'block',
}

@Entity('risk_assessments')
@Index(['organizationId'])
@Index(['paymentId'])
export class RiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @Column('uuid')
  paymentId!: string;

  @Column({ type: 'integer' })
  score!: number;

  @Column({
    type: 'enum',
    enum: RiskDecision,
  })
  decision!: RiskDecision;

  @Column({
    type: 'jsonb',
  })
  signals!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  explanation!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
