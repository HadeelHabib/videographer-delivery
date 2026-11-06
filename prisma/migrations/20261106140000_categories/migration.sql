-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- The categories the pickers used to hard-code, plus anything galleries already use.
INSERT INTO "categories" ("name") VALUES ('wedding'), ('portrait'), ('event'), ('commercial'), ('other') ON CONFLICT DO NOTHING;
INSERT INTO "categories" ("name") SELECT DISTINCT lower(trim("category")) FROM "galleries" WHERE "category" IS NOT NULL AND trim("category") <> '' ON CONFLICT DO NOTHING;
