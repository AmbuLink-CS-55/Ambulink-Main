# Client Dashboard (Vite)

## Environment

`apps/client-dashboard/.env` is generated from root `.env` via:

```sh
npm run env:sync
```

Generated keys:

- `VITE_API_SERVER_URL`
- `VITE_WS_SERVER_URL`
- `VITE_DISPATCHER_ID`
- `VITE_PROVIDER_ID`

Do not edit `apps/client-dashboard/.env` directly; update root `.env` and run sync again.

## Run

From repo root:

```sh
npm run dev
```

or dashboard only:

```sh
npm run dev --workspace=apps/client-dashboard
```
