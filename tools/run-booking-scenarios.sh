#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/ambulink_test}"
export NODE_ENV="${NODE_ENV:-test}"
export APP_STAGE="${APP_STAGE:-test}"
export JWT_SECRET="${JWT_SECRET:-12345678901234567890123456789012}"
export SCENARIO_LOG_DIR="${SCENARIO_LOG_DIR:-apps/backend/test-results/scenario}"
export SCENARIO_TIMEOUT_MS="${SCENARIO_TIMEOUT_MS:-25000}"
export SCENARIO_STRICT_EVENT_ORDER="${SCENARIO_STRICT_EVENT_ORDER:-true}"

cleanup() {
  docker compose -f docker-compose.scenario.yml down >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[scenario] starting postgres"
docker compose -f docker-compose.scenario.yml up -d scenario-db >/dev/null

echo "[scenario] waiting for postgres"
for _ in {1..30}; do
  if docker compose -f docker-compose.scenario.yml exec -T scenario-db pg_isready -U postgres -d ambulink_test >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[scenario] migrate"
MIGRATED=0
for _ in {1..5}; do
  if npm run migrate:apply --prefix apps/backend; then
    MIGRATED=1
    break
  fi
  echo "[scenario] migrate retry"
  sleep 2
done
if [ "$MIGRATED" -ne 1 ]; then
  echo "[scenario] migrate failed after retries"
  exit 1
fi

echo "[scenario] seed"
SEEDED=0
for _ in {1..5}; do
  if npm run seed:test --prefix apps/backend; then
    SEEDED=1
    break
  fi
  echo "[scenario] seed retry"
  sleep 2
done
if [ "$SEEDED" -ne 1 ]; then
  echo "[scenario] seed failed after retries"
  exit 1
fi

echo "[scenario] integration tests"
npm run test:integration:backend

echo "[scenario] scenario tests"
npm run test:scenario

echo "[scenario] done"
