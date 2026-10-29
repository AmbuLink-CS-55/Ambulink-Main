#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    postgresql postgresql-contrib postgresql-16-postgis-3
fi

if ! dpkg -s postgresql-16-postgis-3 >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql-16-postgis-3
fi

sudo service postgresql start
until pg_isready -q; do sleep 1; done

sudo -u postgres psql -c "ALTER USER postgres PASSWORD '123';" >/dev/null

if [ ! -f .env ]; then
  cp .env_example .env
  sed -i \
    -e 's|^API_SERVER_URL=.*|API_SERVER_URL=http://localhost:3000/api|' \
    -e 's|^WS_SERVER_URL=.*|WS_SERVER_URL=ws://localhost:3000|' \
    -e 's|^JWT_SECRET=.*|JWT_SECRET=dev-cloud-agent-jwt-secret-min-32-chars|' \
    .env
fi

npm ci
npm run env:sync
npm run migrate
npm run seed
npm run build --workspace=apps/backend
