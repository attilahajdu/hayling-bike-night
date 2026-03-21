#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/ati/hayling-bike-night"
PID_FILE="$ROOT_DIR/.local-run/pids"

cd "$ROOT_DIR"

if [[ -f "$PID_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$PID_FILE"

  if [[ -n "${CMS_PID:-}" ]] && kill -0 "$CMS_PID" >/dev/null 2>&1; then
    echo "Stopping Strapi (PID $CMS_PID)..."
    kill "$CMS_PID" || true
  fi

  if [[ -n "${WEB_PID:-}" ]] && kill -0 "$WEB_PID" >/dev/null 2>&1; then
    echo "Stopping Next.js (PID $WEB_PID)..."
    kill "$WEB_PID" || true
  fi
fi

# Fallback: kill any lingering dev processes even if PID file stale/empty
pkill -f "next dev --turbopack" >/dev/null 2>&1 || true
pkill -f "strapi develop" >/dev/null 2>&1 || true

# Fallback: free ports explicitly
for p in 3000 3001 1337; do
  PORT_PID="$(lsof -ti :"$p" 2>/dev/null || true)"
  if [[ -n "$PORT_PID" ]]; then
    echo "Stopping process on port $p (PID $PORT_PID)..."
    kill "$PORT_PID" >/dev/null 2>&1 || true
  fi
done

echo "Stopping Postgres container..."
docker compose stop postgres >/dev/null || true

echo "Stopped local services."
