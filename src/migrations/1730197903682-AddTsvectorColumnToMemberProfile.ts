import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTsvectorColumnToMemberProfile1730197903682 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the tsvector column to the Member table
        await queryRunner.query(`
            ALTER TABLE "MemberProfile"
            ADD COLUMN "search_vector" tsvector
        `);

        // Create a GIN index on the tsvector column
        await queryRunner.query(`
            CREATE INDEX "member_profile_search_idx"
            ON "MemberProfile"
            USING GIN ("search_vector")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the GIN index
        await queryRunner.query(`
            DROP INDEX "member_profile_search_idx"
        `);

        // Drop the tsvector column
        await queryRunner.query(`
            ALTER TABLE "MemberProfile"
            DROP COLUMN "search_vector"
        `);
    }
}
