import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Issues a single live token per (accountType, accountId); only its hash is stored.
export async function issueToken(accountType: string, accountId: number, ttlMs: number) {
  await prisma.passwordResetToken.deleteMany({ where: { accountType, accountId } });
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { tokenHash: hashToken(token), accountType, accountId, expiresAt: new Date(Date.now() + ttlMs) },
  });
  return token;
}

export async function findLiveToken(token: string, accountType?: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  if (accountType && row.accountType !== accountType) return null;
  return row;
}

// Atomically claims a token so two concurrent requests can't both succeed.
export async function claimToken(id: number) {
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return claimed.count === 1;
}
