# Ambulink Monorepo

## 1) Install

```sh
npm install
```

## 2) Environment setup (required)

The root `.env` is the single source of truth. App-level `.env` files are generated from it.

1. Copy root example:

```sh
cp .env_example .env
```

2. Fill these required keys in root `.env`:
- `API_SERVER_URL`
- `WS_SERVER_URL`
- `PROVIDER_ID`
- `DISPATCHER_ID`
- `PATIENT_ID`
- `DRIVER_ID`
- `EMT_ID`
- `APP_STAGE`
- `DATABASE_URL`

3. Generate app env files:

```sh
npm run env:sync
```

Generated files:
- `apps/mobile/.env`
- `apps/client-dashboard/.env`
- `apps/backend/.env`

Notes:
- Do not hand-edit generated app `.env` files; update root `.env` and re-run `npm run env:sync`.
- `npm run dev` runs `env:sync` automatically before starting apps.

## 3) Database setup

```sh
docker build -t postgres-postgis .
docker run --name postgres-db -e POSTGRES_PASSWORD=123 -p 5432:5432 -d postgres-postgis
```

If container already exists but is stopped:

```sh
docker start postgres-db
```

Apply schema and seed:

```sh
npm run migrate
npm run seed
```

## 4) Run apps

```sh
npm run dev
```

Common tasks:

```sh
npm run build
npm run lint
npm run test
```

## 5) Automated booking lifecycle testing

Backend unit tests:

```sh
npm run test:unit:backend
```

Backend integration tests (requires Postgres + PostGIS):

```sh
npm run test:integration:backend
```

Scenario tests (multi-actor sockets + HTTP lifecycle):

```sh
npm run test:scenario
```

Single-command local runner (starts DB container, migrates, seeds, then runs integration + scenario):

```sh
npm run test:booking-lifecycle
```
