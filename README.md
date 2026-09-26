# Photo & Video Delivery Platform

Single-tenant gallery delivery app: upload footage/photos, transcode video into
selectable renditions, and send clients a password-protected branded gallery link.
Built with Next.js 16 (App Router), Prisma/PostgreSQL, Cloudflare R2, and a standalone
ffmpeg worker.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in:
   - `DATABASE_URL` — a PostgreSQL connection string
   - `SESSION_SECRET`, `GALLERY_TOKEN_SECRET` — random strings (`openssl rand -base64 32`)
   - `R2_*` — Cloudflare R2 bucket + API credentials
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — the one admin account, used by the seed script

3. **R2 bucket CORS**

   The browser uploads directly to R2 and reads the `ETag` response header for each
   part, so the bucket's CORS policy must allow your app's origin and expose `ETag`:

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-domain.example.com"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

4. **Database**

   ```bash
   npm run db:migrate   # creates tables from prisma/schema.prisma
   npm run db:seed      # creates the admin account from ADMIN_EMAIL/ADMIN_PASSWORD
   ```

5. **Run the app**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000/admin/login`.

6. **Run the transcoding worker** (separate process — needs the `ffmpeg` binary on
   `PATH`, or set `FFMPEG_PATH` in `.env`)

   ```bash
   npm run worker
   ```

   The worker polls `processing_jobs` for queued rows, downloads the original from
   R2, transcodes with `fluent-ffmpeg`, and uploads each rendition back to R2. It's
   deliberately a standalone script rather than a Next.js API route — transcoding a
   multi-minute video can take longer than a serverless/route timeout allows.

## Project layout

- `src/app/admin/(app)/*` — protected admin dashboard (galleries, comments, vault, settings)
- `src/app/gallery/[slug]` — public, password-gated client gallery
- `src/app/portfolio/*` — public portfolio + moderated comments, no auth
- `src/app/api/*` — route handlers (auth, galleries, media, renditions, public endpoints)
- `src/proxy.ts` — route protection (Next 16 renamed Middleware to Proxy)
- `worker/src/index.ts` — standalone ffmpeg transcoding worker
- `prisma/schema.prisma` — database schema; `prisma/seed.ts` creates the admin account

## Known simplifications

- **Vault archiving** moves objects to a `vault/` prefix within the same R2 bucket
  (R2 has no native cold-storage tier). Swapping in a second provider later only
  means changing `moveObject` in `src/lib/r2.ts`.
- **Comment spam gate** is a honeypot field + in-memory per-IP rate limit — enough
  for a single-instance deployment, not a full spam/captcha solution.
- **Chunked upload resume** re-requests presigned URLs per part and retries failed
  parts within a session; resuming after a full page reload would need the
  in-flight upload state (uploadId + completed part list) persisted to
  `localStorage`, which isn't wired up yet.
