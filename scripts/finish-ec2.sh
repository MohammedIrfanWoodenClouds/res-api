#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/ubuntu/res-api
REPO=https://github.com/MohammedIrfanWoodenClouds/res-api.git
DOMAIN=res-api.13.232.129.80.nip.io

cd "$APP_DIR"
if [ ! -d .git ]; then
  git init
  git remote add origin "$REPO"
fi
git fetch origin
git checkout -f -B master origin/master

if [ ! -f .env ]; then
  echo "ERROR: $APP_DIR/.env missing" >&2
  exit 1
fi

mkdir -p uploads
npm install --omit=dev

sudo cp "$APP_DIR/deploy/res-api.service" /etc/systemd/system/res-api.service
sudo systemctl daemon-reload
sudo systemctl enable res-api.service
sudo systemctl restart res-api.service
sleep 5
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
echo "journal: $(sudo journalctl -u res-api -n 30 --no-pager || true)"
echo "BOOTSTRAP_OK"
