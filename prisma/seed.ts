import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

// Single-tenant app: there is no signup screen, so the one admin account is
// created here, from ADMIN_EMAIL / ADMIN_PASSWORD in the environment.
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding");
  }

  const passwordHash = await hashPassword(password);

  const photographer = await prisma.photographer.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: process.env.ADMIN_NAME },
  });

  console.log(`Admin account ready: ${photographer.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
