-- AlterTable
ALTER TABLE "photographers" ADD COLUMN "password_changed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3);
