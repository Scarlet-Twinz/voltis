import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRiskEngine1788520885353 implements MigrationInterface {
    name = 'AddRiskEngine1788520885353'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."risk_assessments_decision_enum" AS ENUM('allow', 'review', 'block')`);
        await queryRunner.query(`CREATE TABLE "risk_assessments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "paymentId" uuid NOT NULL, "score" integer NOT NULL, "decision" "public"."risk_assessments_decision_enum" NOT NULL, "signals" jsonb NOT NULL, "explanation" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2717ff3f294d30390a712653d63" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_48a6cbf3db98bc76347a8ff461" ON "risk_assessments" ("paymentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f684f41ffcbcb28797245ad881" ON "risk_assessments" ("organizationId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f684f41ffcbcb28797245ad881"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48a6cbf3db98bc76347a8ff461"`);
        await queryRunner.query(`DROP TABLE "risk_assessments"`);
        await queryRunner.query(`DROP TYPE "public"."risk_assessments_decision_enum"`);
    }

}
