export class AddPayments1788512471341 {
    name = 'AddPayments1788512471341';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('card', 'bank_transfer', 'wallet', 'cash')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "reference" character varying(100) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "method" "public"."payments_method_enum" NOT NULL, "amount" bigint NOT NULL, "currency" character varying(3) NOT NULL, "processorReference" character varying(100), "failureReason" text, "metadata" jsonb, "processedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_557ce3a59c44d1d6bca28f2366" ON "payments" ("organizationId", "reference") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_557ce3a59c44d1d6bca28f2366"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    }
}
//# sourceMappingURL=1788512471341-AddPayments.js.map