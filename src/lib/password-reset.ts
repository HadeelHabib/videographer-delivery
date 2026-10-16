import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmailSafe } from "@/lib/email";
import { claimToken, findLiveToken, issueToken } from "@/lib/auth-tokens";

export type AccountType = "admin" | "user";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

  const token = await issueToken(type, account.id, TOKEN_TTL_MS);

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
  const row = await findLiveToken(token);
  return row && (row.accountType === "admin" || row.accountType === "user") ? row : null;
}

export async function completePasswordReset(token: string, newPassword: string) {
  const row = await validateResetToken(token);
  if (!row) return false;

  const passwordHash = await hashPassword(newPassword);
  if (!(await claimToken(row.id))) return false;

  if (row.accountType === "admin") {
    await prisma.photographer.update({ where: { id: row.accountId }, data: { passwordHash, passwordChangedAt: new Date() } });
  } else {
    // Opening the emailed link proves the visitor owns this address.
    await prisma.user.updateMany({ where: { id: row.accountId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
    await prisma.user.update({ where: { id: row.accountId }, data: { passwordHash, passwordChangedAt: new Date() } });
  }
  await prisma.passwordResetToken.deleteMany({
    where: { accountType: row.accountType, accountId: row.accountId },
  });
  return true;
}
