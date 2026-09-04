import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReconciliationAndWebhooks1788520350941 implements MigrationInterface {
    name = 'AddReconciliationAndWebhooks1788520350941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_payments_organization_idempotency"`);
        await queryRunner.query(`CREATE TYPE "public"."reconciliation_discrepancies_type_enum" AS ENUM('missing_transaction', 'transaction_not_found', 'amount_mismatch', 'currency_mismatch', 'status_mismatch', 'missing_ledger_entries', 'unbalanced_ledger', 'transaction_ledger_amount_mismatch')`);
        await queryRunner.query(`CREATE TABLE "reconciliation_discrepancies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "organizationId" uuid NOT NULL, "type" "public"."reconciliation_discrepancies_type_enum" NOT NULL, "paymentId" uuid, "transactionId" uuid, "message" text NOT NULL, "details" jsonb, "resolved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9d93a4b73200714b68169bc46d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_10889050b4d7ed7d898e3b2831" ON "reconciliation_discrepancies" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a2dea8ab319e1e8a586211eb4" ON "reconciliation_discrepancies" ("runId") `);
        await queryRunner.query(`CREATE TYPE "public"."reconciliation_runs_status_enum" AS ENUM('running', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "reconciliation_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "status" "public"."reconciliation_runs_status_enum" NOT NULL DEFAULT 'running', "paymentsChecked" integer NOT NULL DEFAULT '0', "transactionsChecked" integer NOT NULL DEFAULT '0', "ledgerEntriesChecked" integer NOT NULL DEFAULT '0', "matchedCount" integer NOT NULL DEFAULT '0', "discrepancyCount" integer NOT NULL DEFAULT '0', "failureReason" text, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4edbdb165c9e754997036a4176a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."webhook_deliveries_status_enum" AS ENUM('pending', 'delivered', 'failed')`);
        await queryRunner.query(`CREATE TABLE "webhook_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "endpointId" uuid NOT NULL, "eventId" character varying(150) NOT NULL, "eventType" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "status" "public"."webhook_deliveries_status_enum" NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "responseStatus" integer, "responseBody" text, "failureReason" text, "deliveredAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_535dd409947fb6d8fc6dfc0112a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_981677c4e790567f3306581e0b" ON "webhook_deliveries" ("eventId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f63fc91ff6cbd3f8238b9a781" ON "webhook_deliveries" ("endpointId") `);
        await queryRunner.query(`CREATE TABLE "webhook_endpoints" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "url" character varying(500) NOT NULL, "secret" character varying(255) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_054c4cfb95223732f5939d2d546" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bd4be0a195cf4f5682aae8b387" ON "webhook_endpoints" ("organizationId", "url") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c68dd19bf9a837f4c9a351b1aa" ON "payments" ("organizationId", "idempotencyKey") `);
        await queryRunner.query(`ALTER TABLE "reconciliation_discrepancies" ADD CONSTRAINT "FK_3a2dea8ab319e1e8a586211eb4d" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "FK_9f63fc91ff6cbd3f8238b9a7812" FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhook_deliveries" DROP CONSTRAINT "FK_9f63fc91ff6cbd3f8238b9a7812"`);
        await queryRunner.query(`ALTER TABLE "reconciliation_discrepancies" DROP CONSTRAINT "FK_3a2dea8ab319e1e8a586211eb4d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c68dd19bf9a837f4c9a351b1aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd4be0a195cf4f5682aae8b387"`);
        await queryRunner.query(`DROP TABLE "webhook_endpoints"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f63fc91ff6cbd3f8238b9a781"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_981677c4e790567f3306581e0b"`);
        await queryRunner.query(`DROP TABLE "webhook_deliveries"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_deliveries_status_enum"`);
        await queryRunner.query(`DROP TABLE "reconciliation_runs"`);
        await queryRunner.query(`DROP TYPE "public"."reconciliation_runs_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a2dea8ab319e1e8a586211eb4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10889050b4d7ed7d898e3b2831"`);
        await queryRunner.query(`DROP TABLE "reconciliation_discrepancies"`);
        await queryRunner.query(`DROP TYPE "public"."reconciliation_discrepancies_type_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_payments_organization_idempotency" ON "payments" ("organizationId", "idempotencyKey") `);
    }

}
