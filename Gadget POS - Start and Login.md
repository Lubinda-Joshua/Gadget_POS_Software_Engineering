---
aliases:
  - Gadget POS startup guide
tags:
  - gadget-pos
  - setup
  - login
---

# Gadget POS — Start and Login

## First-time setup

Open a terminal in the `gadget-pos-system` folder, then run:

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

> [!warning]
> Only copy `.env.example` when creating the `.env` file for the first time. Do not overwrite an `.env` file that already contains your settings.

PostgreSQL must be running before the migration and seed commands are used.

## Start the application later

After the first-time setup, normally only this command is needed:

```bash
pnpm dev
```

Open the application in a browser:

<http://localhost:3000>

Stop the development server by pressing `Ctrl+C` in the terminal.

## Login details

The following demonstration accounts are created by `pnpm db:seed`:

| Account | Email | Password |
| --- | --- | --- |
| Administrator | `admin@example.com` | `admin123456` |
| Cashier | `cashier@example.com` | `cashier123456` |

Use the **Administrator** account when you need access to products, stock, users, refunds, settings, and reports.

> [!important]
> These passwords are for local demonstration only. Do not reuse them in a production deployment.

## Docker alternative

To run the web application and PostgreSQL with Docker:

```bash
docker compose up --build
```

Then open <http://localhost:3000>. To stop the containers, press `Ctrl+C`, then run:

```bash
docker compose down
```

## If login does not work

Run the seed command again and restart the development server:

```bash
pnpm db:seed
pnpm dev
```

Related project notes: [[README]] · [[docs/getting-started|Getting started]] · [[docs/configuration|Configuration]]
