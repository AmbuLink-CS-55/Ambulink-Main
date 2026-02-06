# AmbuLink Mono Repo Summary

## Overview
- **Monorepo layout**: `backend/` (NestJS + Drizzle ORM), `client-dashboard/` (React + Vite + shadcn/ui), and `mobile/` (Expo + file-based routing) share tooling and docs; root `setup.js` bootstraps env once per contributor.
- **Primary focus**: Real-time ambulance dispatching (bookings, dispatchers, drivers, patients, ambulances) with geospatial data (PostGIS) plus map-heavy client experiences connected via Socket.IO.

## Getting started essentials
- Copy `.env.example` to `.env` in backend and each frontend (dashboard/mobile); mobile requires only `EXPO_PUBLIC_API_SERVER_URL` and `EXPO_PUBLIC_WS_SERVER_URL` updates (keep ports the same, swap IP to your machine).
- Backend runs Postgres with PostGIS (Docker build + run) and Redis (`docker run redis`); Drizzle CLI manages schema via `npm run generate`, `npm run migrate`, `npm run seed` (seed script adds baseline data), and `npm run studio` to inspect the database.
- `Docs/getting_started.md` contains the setup steps listed above plus tips (`npm run start` available in each project) and helpful links (Uniwind, Tailwind, Drizzle docs, etc.).
- Running `npm i` in `mobile/` and `backend/` installs dependencies; `client-dashboard` uses Vite scripts (`start`, `build`, `lint`, `preview`).

## Backend in detail
- NestJS 11 application (`backend/src/app.module.ts`) wires together `AmbulanceProvider`, `Patient`, `Driver`, `Ambulance`, `Booking`, and `Dispatcher` modules; common socket services live under `backend/src/common/socket`.
- Drizzle schema defined in `backend/src/common/database/schema.ts`, with Zod validation pipes (`backend/src/common/pipes/zod-validation.pipe.ts`) and seeds (`seed.ts`, `seed2.ts`) for data population; PostGIS extension must be added manually to the generated SQL.
- Real-time features include gateways/services for bookings and dispatchers (`booking.service.ts`, `dispatcher.gateway.ts`, `patient.gateway.ts`) interacting with Socket.IO and shared Redis cache/locks (`ioredis`).
- Scripts: `npm run start[:dev/prod/debug]`, `npm run lint`, `npm run test[:watch/cov/e2e]`, `npm run generate/migrate/studio`, `npm run seed`.

## Client dashboard (web)
- Vite + React 19 + TypeScript + shadcn/ui template; uses Zustang for state, MapLibre GL for mapping, and Socket.IO client for live updates (`client-dashboard/src/hooks/use-socket-store.ts`).
- Key UI pieces: `layouts/DashboardLayout.tsx`, new `components/BookingRequestOverlay.tsx`, existing map hooks/layouts rely on `maplibre-gl`/`@hugeicons` for iconography and `tailwindcss` for styling (with `tailwind-merge`).
- Environment configuration stored in `client-dashboard/.env` and `env.ts`; run `npm run start` for dev preview.

## Mobile app (Expo)
- Expo app under `mobile/` built with Expo Router (file-based routing); primary screens include patient map options/components (`mobile/src/app/(patient)/map.tsx`, `mobile/src/components/patient/MapOptions.tsx`).
- Uses `EXPO_PUBLIC_API_SERVER_URL` and `EXPO_PUBLIC_WS_SERVER_URL` for backend communication (HTTP + WebSocket).

## Next steps / advice prompts
- Ask the LLM about authentication integration (planned but not yet implemented; see backend README note) and best practices for plugging NestJS auth guards.
- Request guidance on scaling the socket/booking flow with PostGIS queries or dispatcher allocation logic.
- Query for improving UI/UX (map interactions, overlay behavior) using current dashboard/mobile map components and `use-socket-store` hook.
For more detail see `Docs/getting_started.md`, `backend/README.md`, `client-dashboard/README.md`, and `mobile/README.md` before asking deeper questions.
