import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/email";
import { claimToken, findLiveToken, issueToken } from "@/lib/auth-tokens";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TYPE = "verify";

export async function sendVerificationEmail(user: { id: number; email: string }) {
  const token = await issueToken(TYPE, user.id, TOKEN_TTL_MS);
  const link = `${process.env.APP_URL ?? ""}/account/verify-email?token=${token}`;
  sendEmailSafe({
    to: user.email,
    subject: "Confirm your email address",
    html: [
      "<p>Welcome! Please confirm your email address so you can leave comments on your galleries.</p>",
      `<p><a href="${link}">Confirm my email</a></p>`,
      "<p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>",
    ].join(""),
  });
}

export async function verifyEmailToken(token: string) {
  const row = await findLiveToken(token, TYPE);
  if (!row || !(await claimToken(row.id))) return false;
  await prisma.user.updateMany({ where: { id: row.accountId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
  await prisma.passwordResetToken.deleteMany({ where: { accountType: TYPE, accountId: row.accountId } });
  return true;
}
