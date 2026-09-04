#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/ubuntu/res-api
REPO=https://github.com/MohammedIrfanWoodenClouds/res-api.git
DOMAIN=res-api.13.232.129.80.nip.io

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

node -v
npm -v

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout master
  git -C "$APP_DIR" reset --hard origin/master
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: $APP_DIR/.env missing — copy it before starting" >&2
  exit 1
fi

mkdir -p "$APP_DIR/uploads"
cd "$APP_DIR"
npm install --omit=dev

sudo cp "$APP_DIR/deploy/res-api.service" /etc/systemd/system/res-api.service
sudo systemctl daemon-reload
sudo systemctl enable res-api.service
sudo systemctl restart res-api.service
sleep 4
sudo systemctl --no-pager --full status res-api.service | head -25

sudo cp "$APP_DIR/deploy/nginx-res-api.conf" /etc/nginx/sites-available/res-api
sudo ln -sfn /etc/nginx/sites-available/res-api /etc/nginx/sites-enabled/res-api
sudo nginx -t
sudo systemctl reload nginx

if command -v certbot >/dev/null 2>&1; then
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
fi

echo "local: $(curl -sS http://127.0.0.1:5000/api/health || true)"
echo "http:  $(curl -sS "http://${DOMAIN}/api/health" || true)"
echo "https: $(curl -sS "https://${DOMAIN}/api/health" || true)"
echo "BOOTSTRAP_OK"
