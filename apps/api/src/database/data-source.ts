import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Account } from '../accounts/account.entity.js';
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { ReconciliationDiscrepancy } from '../reconciliation/reconciliation-discrepancy.entity.js';
import { ReconciliationRun } from '../reconciliation/reconciliation-run.entity.js';
import { RiskAssessment } from '../risk/risk-assessment.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { User } from '../users/user.entity.js';
import { WebhookDelivery } from '../webhooks/webhook-delivery.entity.js';
import { WebhookEndpoint } from '../webhooks/webhook-endpoint.entity.js';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'voltis',
  password: process.env.DB_PASSWORD ?? 'voltis_dev_password',
  database: process.env.DB_NAME ?? 'voltis',
  entities: [
    User,
    Organization,
    Account,
    Transaction,
    LedgerEntry,
    Payment,
    ReconciliationRun,
    ReconciliationDiscrepancy,
    WebhookEndpoint,
    WebhookDelivery,
    RiskAssessment,
  ],
  migrations: [
    'apps/api/src/database/migrations/*.ts',
    'apps/api/dist/database/migrations/*.js',
    'src/database/migrations/*.ts',
    'dist/database/migrations/*.js',
  ],
  synchronize: false,
});

export default dataSource;
