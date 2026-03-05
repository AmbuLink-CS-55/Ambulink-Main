# Backend (NestJS)

## Environment

`apps/backend/.env` is generated from root `.env` via:

```sh
npm run env:sync
```

Generated keys include:
- `DATABASE_URL`
- `PATIENT_ID`
- `DRIVER_ID`
- `EMT_ID`
- `DISPATCHER_ID`
- `PROVIDER_ID`
- `APP_STAGE`
- `FRONTEND_URL`
- `FRONTEND_URLS`

Do not edit `apps/backend/.env` directly; update root `.env` and run sync again.

## Setup

From repo root:

```sh
npm run migrate
npm run seed
```

Run backend only:

```sh
npm run dev --workspace=apps/backend
```
