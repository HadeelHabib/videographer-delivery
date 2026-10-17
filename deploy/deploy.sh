#!/usr/bin/env bash
# Deploys the latest code. Run as the app user from anywhere:
#   bash /srv/photo-delivery/deploy/deploy.sh
# Steps: pull, install, migrate the database, build, reload PM2, refresh the Caddy site.
set -euo pipefail

cd "$(dirname "$0")/.."

[ -f .env ] || { echo ".env is missing — copy .env.production.example to .env and fill it in." >&2; exit 1; }

# Read one value from .env without sourcing it (passwords may contain $ or !).
env_get() {
  grep -E "^$1=" .env | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true
}

APP_URL="$(env_get APP_URL)"
case "$APP_URL" in
  */) echo "APP_URL in .env must not end with a slash (got: '$APP_URL')." >&2; exit 1 ;;
  https://*) ;;
  *) echo "APP_URL in .env must be the public https:// address (got: '${APP_URL:-empty}')." >&2; exit 1 ;;
esac
if [ "$(env_get STORAGE_PROVIDER)" = "local" ]; then
  echo "STORAGE_PROVIDER=local is for development only — set it to r2 in .env." >&2
  exit 1
fi

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Installing dependencies"
npm ci

echo "==> Applying database migrations"
npx prisma generate
# Neon's pooled connection can hang on migrations; use the direct one when provided.
DIRECT_URL="$(env_get DIRECT_DATABASE_URL)"
if [ -n "$DIRECT_URL" ]; then
  DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
else
  npx prisma migrate deploy
fi

echo "==> Building"
npm run build

echo "==> Restarting app and worker"
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Updating HTTPS proxy for ${APP_URL}"
HOST="$(echo "$APP_URL" | sed -E 's#^https?://##; s#/.*$##')"
sed "s/__SITE_ADDRESS__/${HOST}/g" deploy/Caddyfile | sudo tee /etc/caddy/Caddyfile >/dev/null
sudo systemctl reload caddy

echo "==> Checking health"
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
    echo "Healthy. Live at ${APP_URL}"
    pm2 status
    exit 0
  fi
  sleep 3
done
echo "App did not become healthy — check: pm2 logs web --lines 50" >&2
exit 1
