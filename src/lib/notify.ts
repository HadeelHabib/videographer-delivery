import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/email";

// Emails every registered visitor when a gallery becomes public — never for
// private client deliveries, since that would leak a client's name/existence
// to unrelated subscribers. Guarded by publicNotifiedAt so toggling
// public -> private -> public doesn't re-notify everyone.
export async function notifySubscribersOfNewPublicGallery(gallery: { id: number; clientName: string; category: string | null }) {
  const users = await prisma.user.findMany({ select: { email: true, name: true } });
  if (users.length === 0) return;

  const appUrl = process.env.APP_URL ?? "";
  const subject = `New work from the studio: ${gallery.clientName}`;
  const what = gallery.category ? `New ${gallery.category} work` : "New work";
  const html = [
    `<p>${what} just went up on the portfolio.</p>`,
    appUrl ? `<p><a href="${appUrl}/portfolio">View the portfolio</a></p>` : "",
  ].join("");

  for (const user of users) {
    sendEmailSafe({ to: user.email, subject, html });
  }

  await prisma.gallery.update({ where: { id: gallery.id }, data: { publicNotifiedAt: new Date() } });
}
