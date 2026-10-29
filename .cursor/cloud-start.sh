#!/usr/bin/env bash
set -euo pipefail

sudo service postgresql start
until pg_isready -q; do sleep 1; done

mkdir -p /tmp/ambulink-booking-media

if ! tmux has-session -t backend 2>/dev/null; then
  tmux new-session -d -s backend \
    "node apps/backend/dist/src/main.js 2>&1 | tee /tmp/ambulink-backend.log"
fi

if ! tmux has-session -t dashboard 2>/dev/null; then
  tmux new-session -d -s dashboard \
    "npm run start --workspace=apps/client-dashboard -- --host 0.0.0.0 --port 5173 2>&1 | tee /tmp/ambulink-dashboard.log"
fi

for _ in $(seq 1 90); do
  if curl -sf http://127.0.0.1:3000/health >/dev/null; then
    exit 0
  fi
  sleep 2
done

echo "Timed out waiting for backend health at http://127.0.0.1:3000/health" >&2
exit 1
