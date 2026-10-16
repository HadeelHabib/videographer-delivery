// Pluggable email sender. With RESEND_API_KEY + EMAIL_FROM set, sends for
// real via Resend. Otherwise logs the email instead of failing, so the
// notification logic (comment -> photographer, new gallery -> subscribers)
// can be built and tested before real credentials exist.
type EmailArgs = { to: string; subject: string; html: string; headers?: Record<string, string> };

export async function sendEmail({ to, subject, html, headers }: EmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.log(`[email:dev] to=${to} subject=${JSON.stringify(subject)}\n${html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, ...(headers ? { headers } : {}) }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] Resend send failed (${res.status}): ${body}`);
  }
}

// Fire-and-forget: notification emails should never break the request that
// triggered them (posting a comment, creating a gallery) if sending fails.
export function sendEmailSafe(args: EmailArgs) {
  sendEmail(args).catch((err) => console.error("[email] send failed:", err));
}
