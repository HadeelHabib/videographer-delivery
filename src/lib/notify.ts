import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/email";
import { createUnsubscribeToken } from "@/lib/unsubscribe";
import { escapeHtml } from "@/lib/html";

// Emails every opted-in visitor when a public gallery is delivered — never for
// private client deliveries, since that would leak a client's name/existence
// to unrelated subscribers. Guarded by publicNotifiedAt so re-delivering or
// toggling public -> private -> public doesn't re-notify everyone.
export async function notifySubscribersOfNewPublicGallery(gallery: { id: number; clientName: string; category: string | null }) {
  const users = await prisma.user.findMany({ where: { newWorkEmails: true }, select: { id: true, email: true } });

  const appUrl = process.env.APP_URL ?? "";
  const subject = `New work from the studio: ${gallery.clientName}`;
  const what = gallery.category ? `New ${gallery.category} work` : "New work";

  for (const user of users) {
    const unsubscribeUrl = `${appUrl}/account/unsubscribe?token=${await createUnsubscribeToken(user.id)}`;
    const html = [
      `<p>${escapeHtml(what)} just went up on the portfolio.</p>`,
      appUrl ? `<p><a href="${appUrl}/portfolio">View the portfolio</a></p>` : "",
      `<p style="color:#888;font-size:12px">You're getting this because you have an account. <a href="${unsubscribeUrl}">Unsubscribe from new-work emails</a>.</p>`,
    ].join("");
    sendEmailSafe({
      to: user.email,
      subject,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    });
  }

  await prisma.gallery.update({ where: { id: gallery.id }, data: { publicNotifiedAt: new Date() } });
}
