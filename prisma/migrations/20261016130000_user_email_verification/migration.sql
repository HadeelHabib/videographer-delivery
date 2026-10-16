-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);

-- Existing visitors signed up before verification existed; don't lock them out.
UPDATE "users" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;
