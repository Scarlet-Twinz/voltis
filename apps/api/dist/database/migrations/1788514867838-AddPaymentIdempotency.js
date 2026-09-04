export class AddPaymentIdempotency1788514867838 {
    name = 'AddPaymentIdempotency1788514867838';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "payments"
      ADD "idempotencyKey"
      character varying(255)
    `);
        await queryRunner.query(`
      ALTER TABLE "payments"
      ADD "requestFingerprint"
      character varying(64)
    `);
        await queryRunner.query(`
      ALTER TABLE "payments"
      ADD "transactionId"
      uuid
    `);
        await queryRunner.query(`
      UPDATE "payments"
      SET
        "idempotencyKey" =
          'legacy-' || "id",
        "requestFingerprint" =
          repeat('0', 64)
      WHERE
        "idempotencyKey" IS NULL
    `);
        await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "idempotencyKey"
      SET NOT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "requestFingerprint"
      SET NOT NULL
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX
      "IDX_payments_organization_idempotency"
      ON "payments"
      ("organizationId", "idempotencyKey")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX
      "IDX_payments_organization_idempotency"
    `);
        await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "transactionId"
    `);
        await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "requestFingerprint"
    `);
        await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "idempotencyKey"
    `);
    }
}
//# sourceMappingURL=1788514867838-AddPaymentIdempotency.js.map