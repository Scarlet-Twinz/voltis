import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260905130500 implements MigrationInterface {
  name = 'InitialSchema20260905130500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(150) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "defaultCurrency" varchar(3) NOT NULL DEFAULT 'USD',
        "isActive" boolean NOT NULL DEFAULT true,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_organizations_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_organizations_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "account_type_enum" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense')
    `);
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "code" varchar(50) NOT NULL,
        "name" varchar(150) NOT NULL,
        "type" "account_type_enum" NOT NULL,
        "currency" varchar(3) NOT NULL,
        "balance" bigint NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accounts_organization_code" UNIQUE ("organizationId", "code"),
        CONSTRAINT "FK_accounts_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM ('payment', 'transfer', 'refund', 'deposit', 'withdrawal', 'fee', 'adjustment')
    `);
    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed', 'reversed')
    `);
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "reference" varchar(100) NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "status" "transaction_status_enum" NOT NULL DEFAULT 'pending',
        "amount" bigint NOT NULL,
        "currency" varchar(3) NOT NULL,
        "description" text,
        "metadata" jsonb,
        "processedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transactions_organization_reference" UNIQUE ("organizationId", "reference"),
        CONSTRAINT "FK_transactions_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "ledger_entry_type_enum" AS ENUM ('debit', 'credit')
    `);
    await queryRunner.query(`
      CREATE TABLE "ledger_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transactionId" uuid NOT NULL,
        "accountId" uuid NOT NULL,
        "type" "ledger_entry_type_enum" NOT NULL,
        "amount" bigint NOT NULL,
        "currency" varchar(3) NOT NULL,
        "description" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ledger_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ledger_entries_transaction" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ledger_entries_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_ledger_entries_transactionId" ON "ledger_entries" ("transactionId")');
    await queryRunner.query('CREATE INDEX "IDX_ledger_entries_accountId" ON "ledger_entries" ("accountId")');

    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_method_enum" AS ENUM ('card', 'bank_transfer', 'wallet', 'cash')
    `);
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "reference" varchar(100) NOT NULL,
        "idempotencyKey" varchar(255) NOT NULL,
        "requestFingerprint" varchar(64) NOT NULL,
        "transactionId" uuid,
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "method" "payment_method_enum" NOT NULL,
        "amount" bigint NOT NULL,
        "currency" varchar(3) NOT NULL,
        "processorReference" varchar(100),
        "failureReason" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "processedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payments_organization_reference" UNIQUE ("organizationId", "reference"),
        CONSTRAINT "UQ_payments_organization_idempotency" UNIQUE ("organizationId", "idempotencyKey"),
        CONSTRAINT "FK_payments_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_payments_transaction" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "reconciliation_status_enum" AS ENUM ('running', 'completed', 'failed')
    `);
    await queryRunner.query(`
      CREATE TABLE "reconciliation_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "status" "reconciliation_status_enum" NOT NULL DEFAULT 'running',
        "paymentsChecked" integer NOT NULL DEFAULT 0,
        "transactionsChecked" integer NOT NULL DEFAULT 0,
        "ledgerEntriesChecked" integer NOT NULL DEFAULT 0,
        "matchedCount" integer NOT NULL DEFAULT 0,
        "discrepancyCount" integer NOT NULL DEFAULT 0,
        "failureReason" text,
        "completedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reconciliation_runs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reconciliation_runs_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "reconciliation_discrepancy_type_enum" AS ENUM (
        'missing_transaction',
        'transaction_not_found',
        'amount_mismatch',
        'currency_mismatch',
        'status_mismatch',
        'missing_ledger_entries',
        'unbalanced_ledger',
        'transaction_ledger_amount_mismatch'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "reconciliation_discrepancies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "runId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "type" "reconciliation_discrepancy_type_enum" NOT NULL,
        "paymentId" uuid,
        "transactionId" uuid,
        "message" text NOT NULL,
        "details" jsonb,
        "resolved" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reconciliation_discrepancies_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reconciliation_discrepancies_run" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reconciliation_discrepancies_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_reconciliation_discrepancies_runId" ON "reconciliation_discrepancies" ("runId")');
    await queryRunner.query('CREATE INDEX "IDX_reconciliation_discrepancies_organizationId" ON "reconciliation_discrepancies" ("organizationId")');

    await queryRunner.query(`
      CREATE TABLE "webhook_endpoints" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "url" varchar(500) NOT NULL,
        "secret" varchar(255) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_webhook_endpoints_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_webhook_endpoints_organization_url" UNIQUE ("organizationId", "url"),
        CONSTRAINT "FK_webhook_endpoints_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "webhook_delivery_status_enum" AS ENUM ('pending', 'delivered', 'failed')
    `);
    await queryRunner.query(`
      CREATE TABLE "webhook_deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "endpointId" uuid NOT NULL,
        "eventId" varchar(150) NOT NULL,
        "eventType" varchar(100) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "webhook_delivery_status_enum" NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "responseStatus" integer,
        "responseBody" text,
        "failureReason" text,
        "deliveredAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_webhook_deliveries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_webhook_deliveries_endpoint" FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_webhook_deliveries_endpointId" ON "webhook_deliveries" ("endpointId")');
    await queryRunner.query('CREATE INDEX "IDX_webhook_deliveries_eventId" ON "webhook_deliveries" ("eventId")');

    await queryRunner.query(`
      CREATE TYPE "risk_decision_enum" AS ENUM ('allow', 'review', 'block')
    `);
    await queryRunner.query(`
      CREATE TABLE "risk_assessments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "paymentId" uuid NOT NULL,
        "score" integer NOT NULL,
        "decision" "risk_decision_enum" NOT NULL,
        "signals" jsonb NOT NULL,
        "explanation" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_risk_assessments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_risk_assessments_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_risk_assessments_payment" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_risk_assessments_organizationId" ON "risk_assessments" ("organizationId")');
    await queryRunner.query('CREATE INDEX "IDX_risk_assessments_paymentId" ON "risk_assessments" ("paymentId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_risk_assessments_paymentId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_risk_assessments_organizationId"');
    await queryRunner.query('DROP TABLE "risk_assessments"');
    await queryRunner.query('DROP TYPE "risk_decision_enum"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_webhook_deliveries_eventId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_webhook_deliveries_endpointId"');
    await queryRunner.query('DROP TABLE "webhook_deliveries"');
    await queryRunner.query('DROP TYPE "webhook_delivery_status_enum"');
    await queryRunner.query('DROP TABLE "webhook_endpoints"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reconciliation_discrepancies_organizationId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_reconciliation_discrepancies_runId"');
    await queryRunner.query('DROP TABLE "reconciliation_discrepancies"');
    await queryRunner.query('DROP TYPE "reconciliation_discrepancy_type_enum"');
    await queryRunner.query('DROP TABLE "reconciliation_runs"');
    await queryRunner.query('DROP TYPE "reconciliation_status_enum"');

    await queryRunner.query('DROP TABLE "payments"');
    await queryRunner.query('DROP TYPE "payment_method_enum"');
    await queryRunner.query('DROP TYPE "payment_status_enum"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_ledger_entries_accountId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_ledger_entries_transactionId"');
    await queryRunner.query('DROP TABLE "ledger_entries"');
    await queryRunner.query('DROP TYPE "ledger_entry_type_enum"');

    await queryRunner.query('DROP TABLE "transactions"');
    await queryRunner.query('DROP TYPE "transaction_status_enum"');
    await queryRunner.query('DROP TYPE "transaction_type_enum"');

    await queryRunner.query('DROP TABLE "accounts"');
    await queryRunner.query('DROP TYPE "account_type_enum"');

    await queryRunner.query('DROP TABLE "organizations"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
