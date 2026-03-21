#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/ati/hayling-bike-night"
RUN_DIR="$ROOT_DIR/.local-run"
PID_FILE="$RUN_DIR/pids"

mkdir -p "$RUN_DIR"
: > "$PID_FILE"

cd "$ROOT_DIR"

# Ensure stale local dev processes don't keep serving old code
"$ROOT_DIR/scripts/stop-local.sh" >/dev/null 2>&1 || true

echo "[1/3] Starting Postgres container..."
docker compose up -d postgres >/dev/null

echo "[2/3] Starting Strapi (http://localhost:1337/admin)..."
if lsof -i :1337 >/dev/null 2>&1; then
  echo "  - Port 1337 already in use, skipping Strapi start."
else
  npm run develop --workspace cms > "$RUN_DIR/cms.log" 2>&1 &
  CMS_PID=$!
  echo "CMS_PID=$CMS_PID" >> "$PID_FILE"
  echo "  - Strapi PID: $CMS_PID"
fi

echo "[3/3] Starting Next.js (http://localhost:3000)..."
npm run dev --workspace web > "$RUN_DIR/web.log" 2>&1 &
WEB_PID=$!
echo "WEB_PID=$WEB_PID" >> "$PID_FILE"
echo "  - Web PID: $WEB_PID"

echo
echo "Done. Health check URLs:"
echo "- CMS admin: http://localhost:1337/admin"
echo "- Site home: http://localhost:3000"
echo "- Gallery: http://localhost:3000/gallery"
echo "- Upload: http://localhost:3000/upload"
echo "- Submit album: http://localhost:3000/submit-album"
echo "- Moderation: http://localhost:3000/owner/moderation"
echo
echo "Logs:"
echo "- $RUN_DIR/cms.log"
echo "- $RUN_DIR/web.log"
echo
echo "To stop everything: $ROOT_DIR/scripts/stop-local.sh"
