# Getting started

## Local prerequisites

- Node.js 20 or later
- pnpm 9 or later
- PostgreSQL 14 or later

## Setup

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. On a new database, follow the setup screen to create the administrator account.

## Docker alternative

Set `BETTER_AUTH_SECRET` in `.env`, then run:

```bash
docker compose up --build
```

The web application is available on port 3000 and PostgreSQL on port 5432.

## Required environment values

| Name | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret used to protect authentication sessions |
| `BETTER_AUTH_URL` | Canonical application URL, normally `http://localhost:3000` |

Use `.env.example` as the source of truth. Never commit the real `.env` file.
