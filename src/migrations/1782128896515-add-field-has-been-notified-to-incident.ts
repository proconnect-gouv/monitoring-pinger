import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldHasBeenNotifiedToIncident1782128896515 implements MigrationInterface {
    name = 'AddFieldHasBeenNotifiedToIncident1782128896515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incident" ADD "hasBeenNotified" boolean NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "hasBeenNotified"`);
    }

}
