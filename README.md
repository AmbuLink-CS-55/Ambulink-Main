# Ambulink mono repo
Read Docs to get started

## Turborepo
Install dependencies once at the repo root:
```sh
npm install
```

## Environment setup

This repo uses a shared root `.env` as the source of truth. App-specific `.env` files are auto-generated.

1) Edit root `.env` at the repo root.
2) Run:

```sh
npm run env:sync
```

`npm run dev` already runs `env:sync` for you.

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
