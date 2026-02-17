# Ambulink mono repo

## Turborepo

Install dependencies once at the repo root:

```sh
npm install
```

## Environment setup

This repo uses a shared root `.env` as the source of truth. App-specific `.env` files are auto-generated.

1. rename `.env_example` to `.env` at root (ambulink-mono).
2. Run:

```sh
npm run env:sync
```

`npm run dev` already runs `env:sync` for you.

3. Setup Database

- in root folder run `docker build -t postgres-postgis .`
- start the container `docker run --name postgres-db -e POSTGRES_PASSWORD=123 -p 5432:5432 -d postgres-postgis`
- to start the container if you restart your computer or shuts down docker run `docker start postgres-db`
- run `npm run migrate` to seed the database or when ever you change the schema

Run all apps in parallel:

```sh
npm run dev
```

Common tasks:

```sh
npm run build
npm run lint
npm run test
```
