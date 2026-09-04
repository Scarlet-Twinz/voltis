import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddReconciliationAndWebhooks1788520350941 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
