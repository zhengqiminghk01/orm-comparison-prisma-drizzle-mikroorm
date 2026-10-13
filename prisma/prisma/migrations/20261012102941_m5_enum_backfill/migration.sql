-- AlterEnum
ALTER TYPE "comment_status" ADD VALUE 'deleted';
UPDATE "comments" SET "status"='deleted' WHERE "deleted_at" IS NOT NULL;
