# Ali Studio: Portfolio & Client Delivery Platform

**Project summary**

A single website that does two jobs: it shows your best work to new clients, and it delivers finished photos and videos to existing clients through private, password-protected galleries. You manage everything yourself from an admin dashboard, with no developer needed for day-to-day work.

**Live site:** https://videographer-delivery.vercel.app (a custom domain will replace this address)

---

## 1. Public website (what visitors see)

- **Home page** with a hero, services, a Gallery showcase, an About section with your portrait, and a contact call-to-action.
- **Gallery page** designed like a phone photo app: a grid of square album covers with the name and number of galleries under each. Tapping an album opens that category.
- **Category pages** with a gallery carousel for each type of work (weddings, portraits, events, and any categories you add).
- **Visitor comments and testimonials** on each category, readable on light and dark devices.
- **Mobile-first and responsive**, with smooth animations that respect the "reduce motion" accessibility setting.
- **Terms of Service and Privacy Policy** pages.
- **Showcase rule:** only galleries that are both *public* and *delivered* appear on the website. Drafts and private client work never show up by accident.

## 2. Private client delivery

- **One private link per client gallery.** No password to remember: the link is long and unguessable, and the gallery never appears on your website.
- **Photos and videos in one gallery**, with viewing and download tracked.
- **Download control:** choose per gallery whether the client may download.
- **Expiry date:** galleries can be set to expire automatically.
- **Branding per gallery:** your logo and brand colour on the client's page.
- **Gallery status flow:** Draft → Ready → Delivered → Archived, so you always know what is finished and what is not.
- **Client comments** on a gallery, with **threaded replies** from you.
- **Activity log:** see which items were viewed and downloaded.

## 3. Email notifications

- Visitors who create an account get a **"New work" email** when you publish a new public gallery.
- **Sent only once a gallery is Delivered**, never on drafts or edits, and never for private client galleries. Re-publishing a gallery does not send it twice.
- Every email has an **Unsubscribe link**. One click and the visitor stops receiving new-work emails.
- Sent from your own studio name.

## 4. Visitor accounts and sign-in

- Visitors can **sign up and log in** with email and password or with **Continue with Google**.
- **Email verification** for new accounts.
- **Forgot / reset password** by email with one-time, expiring links.
- Changing a password **signs out other devices**.

## 5. Admin dashboard (your control room)

- **Overview page:** analytics at a glance, with galleries grouped by category and recent activity.
- **Dashboard:** all galleries with **search** and status filters.
- **Gallery editor:** details, media upload, delivery, and archive.
- **Categories:** add and remove categories yourself. They become the sections of your public portfolio, and deleting one safely un-files its galleries instead of deleting them.
- **Comments inbox:** review, reply to, and manage comments in one place.
- **Vault:** archived galleries are stored safely and can be **restored** when needed.
- **Settings:** change your admin password with a show/hide option and clear error messages.
- **Professional login page** with show/hide password, clear wrong-password warnings, and animations.

## 6. Uploads and storage

- **Large photo and video uploads** go straight from your browser to secure cloud storage (Cloudflare R2), in chunks, so big files are reliable.
- **Photo previews** are generated automatically (2048px) for fast viewing, while originals stay untouched for download.
- **Videos are delivered in their original quality.**

## 7. Security

- Admin area protected by a login, with attempt limits against guessing.
- Passwords are stored hashed (never in plain text); reset links are one-time and expire.
- Private galleries are hidden from the website and reachable only through their unguessable link.
- Google sign-in is used for visitors only. The admin account stays email and password.
- HTTPS everywhere.

## 8. Technology and hosting

| Part | Service |
|---|---|
| Website and admin | Next.js on Vercel |
| Database | Neon (PostgreSQL) |
| Photo and video storage | Cloudflare R2 |
| Email | Resend |
| Sign-in | Google OAuth |

The code is stored in a private GitHub repository. Every update is deployed automatically. The project has an automated test suite (44 tests passing).

---

## 9. Before launch (our checklist)

| Item | Status |
|---|---|
| Buy and connect your custom domain | To do |
| Verify the domain for email so messages come from your own address | To do |
| Publish the Google sign-in app so any visitor can use it | To do |
| Change the default admin password | To do |
| Remove demo galleries and upload your real work | To do |
| Test a real video upload on the live site | To do |

## 10. Possible next steps

- Per-category descriptions for the public portfolio.
- Editing studio name, tagline, and bio from the dashboard.
- Multiple video quality options (needs an extra processing server).
- Online payments or booking requests.
