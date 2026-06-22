import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultValueFalseToHasBeenNtofieid1782129719813 implements MigrationInterface {
    name = 'AddDefaultValueFalseToHasBeenNtofieid1782129719813'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incident" ALTER COLUMN "hasBeenNotified" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incident" ALTER COLUMN "hasBeenNotified" DROP DEFAULT`);
    }

}
