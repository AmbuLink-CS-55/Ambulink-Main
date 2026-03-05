# Mobile App (Expo)

## Environment

`apps/mobile/.env` is generated from root `.env` via:

```sh
npm run env:sync
```

Required generated keys:
- `EXPO_PUBLIC_API_SERVER_URL`
- `EXPO_PUBLIC_WS_SERVER_URL`
- `EXPO_PUBLIC_PATIENT_ID`
- `EXPO_PUBLIC_DRIVER_ID`
- `EXPO_PUBLIC_EMT_ID`
- `EXPO_PUBLIC_APP_STAGE`

Do not edit `apps/mobile/.env` directly; update root `.env` and run sync again.

## Run

From repo root:

```sh
npm run dev
```

or mobile only:

```sh
npm run start --workspace=apps/mobile
```
