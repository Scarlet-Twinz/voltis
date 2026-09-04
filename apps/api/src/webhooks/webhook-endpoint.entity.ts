import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { WebhookDelivery } from './webhook-delivery.entity.js';

@Entity('webhook_endpoints')
@Index(['organizationId', 'url'], {
  unique: true,
})
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @Column({ length: 500 })
  url!: string;

  @Column({ length: 255 })
  secret!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(
    'WebhookDelivery',
    (delivery: WebhookDelivery) =>
      delivery.endpoint,
  )
  deliveries!: WebhookDelivery[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
