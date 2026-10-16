import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmailSafe } from "@/lib/email";

export type AccountType = "admin" | "user";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function resetPath(type: AccountType) {
  return type === "admin" ? "/admin/reset-password" : "/account/reset-password";
}

// Always resolves without revealing whether the email exists — the caller
// returns the same response either way, so this can't be used to enumerate accounts.
export async function requestPasswordReset(type: AccountType, email: string) {
  const account =
    type === "admin"
      ? await prisma.photographer.findUnique({ where: { email }, select: { id: true, email: true } })
      : await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!account) return;

  // Only the newest link should work.
  await prisma.passwordResetToken.deleteMany({ where: { accountType: type, accountId: account.id } });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: sha256(token),
      accountType: type,
      accountId: account.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const link = `${process.env.APP_URL ?? ""}${resetPath(type)}?token=${token}`;
  sendEmailSafe({
    to: account.email,
    subject: "Reset your password",
    html: [
      "<p>We received a request to reset your password.</p>",
      `<p><a href="${link}">Choose a new password</a></p>`,
      "<p>This link expires in 1 hour and can be used once. If you didn't ask for this, you can ignore this email.</p>",
    ].join(""),
  });
}

export async function validateResetToken(token: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

export async function completePasswordReset(token: string, newPassword: string) {
  const row = await validateResetToken(token);
  if (!row) return false;

  const passwordHash = await hashPassword(newPassword);
  // Claim the token first so two concurrent requests can't both succeed.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return false;

  if (row.accountType === "admin") {
    await prisma.photographer.update({ where: { id: row.accountId }, data: { passwordHash } });
  } else {
    await prisma.user.update({ where: { id: row.accountId }, data: { passwordHash } });
  }
  await prisma.passwordResetToken.deleteMany({
    where: { accountType: row.accountType, accountId: row.accountId },
  });
  return true;
}
