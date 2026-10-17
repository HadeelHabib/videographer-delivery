# Deploying to a VPS

One small Ubuntu server runs everything that can't run on a static host:

| Piece | Where it runs |
|---|---|
| Website + API (Next.js) | the VPS, behind Caddy (automatic HTTPS) |
| Video/photo worker (ffmpeg, sharp) | the VPS, managed by PM2 — **optional**: with `NEXT_PUBLIC_PROCESSING="none"` there is no worker, see below |
| Database | Neon (Postgres) |
| Photos and videos | Cloudflare R2 — the browser uploads and downloads directly, the VPS never proxies files |
| Email | Resend |

Recommended server: Ubuntu 24.04, 2 vCPU, 4 GB RAM, 40 GB+ disk (the worker needs scratch space for the biggest video).

## Without a conversion worker

Set `NEXT_PUBLIC_PROCESSING="none"` in `.env` (the production template already does) and the platform needs no ffmpeg and no worker process:

- **Videos** are delivered exactly as uploaded. Upload a web-ready H.264 MP4 (what editing software exports by default); phone/camera HEVC `.mov` files won't play in most browsers.
- **Photos** get one 2048px preview, made in the admin's browser during upload, which is what viewers see; the full original stays available to download. Upload JPEGs — a browser that can't decode a format (e.g. HEIC) falls back to showing the original.
- The Renditions tab is hidden, and archiving keeps the previews (nothing could regenerate them).

Because nothing here needs a long-running process, the app also runs on any Node host, not just a VPS. Remove the line (or set anything else) to bring the worker back; the rest of this guide assumes you're running the VPS.

## 1. Accounts to prepare first

1. **Neon** — copy the *pooled* connection string, and the same string without `-pooler` (used for migrations).
2. **Cloudflare R2** — create a bucket, an API token with *Object Read & Write* on it, and note the account ID.
3. **Resend** — create an API key. Until your domain is verified you can only send to your own address from `onboarding@resend.dev`.
4. **Google** (optional) — OAuth client; add `<APP_URL>/api/auth/google/callback` as a redirect URI.

## 2. Server

Create the VPS, make sure its provider firewall allows ports **22, 80, 443**, then as root:

```bash
curl -fsSL https://raw.githubusercontent.com/HadeelHabib/videographer-delivery/main/deploy/setup-server.sh -o setup-server.sh
bash setup-server.sh
```

(if the repository is private, copy the file over with `scp` instead). It installs Node 22, ffmpeg, PM2, Caddy, a firewall and fail2ban, adds 2 GB swap, and creates the `deploy` user and `/srv/photo-delivery`. It is safe to run twice.

## 3. First deploy

As the `deploy` user:

```bash
su - deploy
git clone https://github.com/HadeelHabib/videographer-delivery.git /srv/photo-delivery
cd /srv/photo-delivery
cp .env.production.example .env
nano .env                 # fill in every value — see the comments in the file
bash deploy/deploy.sh     # installs, migrates, builds, starts, sets up HTTPS
npm run db:seed           # creates the admin account (first time only)
```

Generate secrets with `openssl rand -base64 32`. Use a long, unique `ADMIN_PASSWORD`.

## 4. R2 CORS (required for uploads and video playback)

In Cloudflare: **R2, your bucket, Settings, CORS Policy**. Paste `deploy/r2-cors.json` and replace `https://example.com` with your real `APP_URL` origin (no trailing slash). Add a second origin for any other address you use.

## Before you own a domain

Point nothing anywhere. Use the server's IP as a free hostname: for IP `203.0.113.10` set

```
APP_URL="https://203-0-113-10.sslip.io"
```

Caddy gets a real certificate for it, so the whole site works over HTTPS. Limits: Google sign-in and Resend's verified sending need a stable domain you control, so test those after you buy one.

## The day you buy the domain

1. DNS: an `A` record for the domain pointing to the server IP.
2. Change `APP_URL` in `.env`, then `bash deploy/deploy.sh` (it rewrites the Caddy site).
3. Verify the domain in Resend (add the SPF/DKIM records it shows), set `EMAIL_FROM`, `bash deploy/deploy.sh` again.
4. Google: add the new callback URL to the OAuth client.
5. R2: update the CORS origin.

## Everyday operations

| Task | Command |
|---|---|
| Ship new code | `bash /srv/photo-delivery/deploy/deploy.sh` |
| Logs | `pm2 logs web` / `pm2 logs worker` |
| Status | `pm2 status` and `curl -s localhost:3000/api/health` |
| Restart | `pm2 restart web worker` |
| Disk used by transcoding scratch files | `du -sh /var/tmp/photo-delivery-worker` |

Backups: Neon keeps point-in-time history on its plans (check the retention on yours); R2 holds the media. The server itself holds nothing that can't be rebuilt from this repo plus `.env`, so keep a copy of `.env` somewhere safe.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `deploy.sh` stops: *APP_URL must be https* | `.env` still has the placeholder or an `http://` address |
| Browser upload fails right away | R2 CORS missing or the origin doesn't exactly match `APP_URL` |
| Videos upload but never become playable | worker not running (`pm2 logs worker`), ffmpeg missing, or scratch disk full |
| `/api/health` returns 503 | `DATABASE_URL` wrong, or the Neon database is asleep — retry in a few seconds |
| Caddy shows a certificate error | DNS doesn't point at the server yet, or ports 80/443 are blocked at the provider |
| Emails don't arrive | `RESEND_API_KEY`/`EMAIL_FROM` unset (they're only logged), or the domain isn't verified |
| `next build` is killed | out of memory — confirm swap is on (`swapon --show`) |
