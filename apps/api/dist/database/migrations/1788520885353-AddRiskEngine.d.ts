import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddRiskEngine1788520885353 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
