#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 VPS. Run as root:
#   bash setup-server.sh
# Safe to re-run: every step checks before it changes anything.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root (or with sudo)." >&2
  exit 1
fi

APP_USER="deploy"
APP_DIR="/srv/photo-delivery"

echo "==> Base packages (git, ffmpeg, firewall, fail2ban)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ffmpeg ufw fail2ban ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

echo "==> Node.js 22"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> PM2"
command -v pm2 >/dev/null || npm install -g pm2

echo "==> Caddy"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y
  apt-get install -y caddy
fi

echo "==> App user '$APP_USER' and folder $APP_DIR"
id "$APP_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$APP_USER"
mkdir -p "$APP_DIR" /var/tmp/photo-delivery-worker
chown -R "$APP_USER":"$APP_USER" "$APP_DIR" /var/tmp/photo-delivery-worker

# The deploy script may update the Caddyfile and reload Caddy — nothing else as root.
cat >/etc/sudoers.d/photo-delivery <<EOF
$APP_USER ALL=(root) NOPASSWD: /usr/bin/tee /etc/caddy/Caddyfile, /usr/bin/systemctl reload caddy
EOF
chmod 440 /etc/sudoers.d/photo-delivery

echo "==> Swap (a 4 GB server can run out of memory during 'next build')"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Firewall (SSH, HTTP, HTTPS only)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> PM2 starts on boot, running as '$APP_USER'"
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null

cat <<EOF

Server is ready. Next, as the '$APP_USER' user:

  su - $APP_USER
  git clone <your-repo-url> $APP_DIR      # the folder is empty, so this works as-is
  cd $APP_DIR
  cp .env.production.example .env         # then edit it with real values
  bash deploy/deploy.sh                   # installs, migrates the database, builds, starts
  npm run db:seed                         # creates the admin account (first time only)

EOF
