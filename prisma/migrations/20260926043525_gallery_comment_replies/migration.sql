-- DropForeignKey
ALTER TABLE "gallery_comments" DROP CONSTRAINT "gallery_comments_user_id_fkey";

-- AlterTable
ALTER TABLE "gallery_comments" ADD COLUMN     "from_photographer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_id" INTEGER,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "gallery_comments" ADD CONSTRAINT "gallery_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_comments" ADD CONSTRAINT "gallery_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "gallery_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
