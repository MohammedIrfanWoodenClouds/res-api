#!/usr/bin/env bash
# Runs on EC2 after a GitHub push (or first bootstrap).
set -euo pipefail

APP_DIR=/home/ubuntu/res-api
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERROR: $APP_DIR/.env missing" >&2
  exit 1
fi

git fetch origin
git checkout master
git reset --hard origin/master

npm ci --omit=dev --no-audit --no-fund
mkdir -p uploads

sudo systemctl daemon-reload
sudo systemctl enable res-api.service
sudo systemctl restart res-api.service
sleep 3
sudo systemctl --no-pager --full status res-api.service | head -20
curl -fsS http://127.0.0.1:5000/api/health
echo
echo "DEPLOY_OK $(date -u +%Y-%m-%dT%H:%M:%SZ)"
