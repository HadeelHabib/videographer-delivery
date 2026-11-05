# Deploying on Vercel (no server)

Works because the platform runs without a conversion worker (`NEXT_PUBLIC_PROCESSING="none"`): the website and API are ordinary serverless functions, the database is Neon and the files live in Cloudflare R2.

> Vercel's free **Hobby** plan is for non-commercial use ([fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)); a site that delivers paid client work counts as commercial. Upgrading to **Pro** later changes nothing in the code.

## 1. Import the project

1. Sign in at vercel.com with GitHub, then **Add New, Project**, and pick the `videographer-delivery` repository.
2. Framework: Next.js (detected). Leave the build and output settings alone — `postinstall` runs `prisma generate` for you.
3. Add the environment variables below **before** pressing Deploy (Settings, Environment Variables, for all environments).
4. Deploy. The first build takes a few minutes.

## 2. Environment variables

Names only — copy the values from your local `.env`, never into chat or into git.

| Name | Value |
|---|---|
| `APP_URL` | the public address with no trailing slash, e.g. `https://yourdomain.com` (use the `*.vercel.app` address until the domain is ready) |
| `DATABASE_URL` | the Neon **pooled** connection string |
| `SESSION_SECRET` | a new random value (`openssl rand -base64 32`) — do not reuse the local one |
| `GALLERY_TOKEN_SECRET` | another new random value |
| `STORAGE_PROVIDER` | `r2` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT` | as in your local `.env` |
| `NEXT_PUBLIC_PROCESSING` | `none` (build-time: change it, then redeploy) |
| `RESEND_API_KEY`, `EMAIL_FROM` | as in your local `.env` (switch `EMAIL_FROM` to your domain once Resend verifies it) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional; blank hides the Google button |

Do **not** set `NEON_WS` (it only exists for networks that block port 5432) or `ADMIN_*` (those are only for the one-time seed, already done).

## 3. Your domain

1. Buy it (Cloudflare Registrar is cheapest at cost price; any registrar works).
2. Vercel project, Settings, **Domains**, add `yourdomain.com` (and `www.` if you want it). Vercel shows the exact DNS records to create.
3. Create those records at your DNS host. If DNS is on Cloudflare, set the records to **DNS only** (grey cloud), not Proxied.
4. When Vercel shows the domain as valid, set `APP_URL` to `https://yourdomain.com` and redeploy (Deployments, three dots, Redeploy).

## 4. Update the services that know your address

- **R2 CORS** (bucket, Settings, CORS Policy): add `https://yourdomain.com` to `AllowedOrigins` (see `r2-cors.json`). Uploads and video playback fail without it.
- **Google** (only if you use it): add `https://yourdomain.com/api/auth/google/callback` to the OAuth client's redirect URIs.
- **Resend**: add the domain, create the SPF/DKIM records it shows at your DNS host, wait for "Verified", then set `EMAIL_FROM` to e.g. `Your Studio <notifications@yourdomain.com>`.

## 5. First-time checks

- `https://yourdomain.com/api/health` returns `{"ok":true}`.
- Sign in at `/admin/login`, change the admin password in Settings (the seeded one is only a placeholder), and upload a test photo.

## Good to know

- **Database changes** are not applied by Vercel. After a release that adds a migration, apply it to Neon yourself before or right after the deploy.
- **Rate limits** (login, comments, resets) are kept in memory per serverless instance, so they slow bots down but are not a hard limit.
- **Uploads never pass through Vercel:** the browser sends files straight to R2; only the small (under 4 MB) photo preview goes through the API.
- **Hobby limits** apply to functions (execution time, bandwidth); media bandwidth is on R2, which doesn't charge for egress.
