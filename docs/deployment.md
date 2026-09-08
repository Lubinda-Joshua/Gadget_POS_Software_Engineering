# Deployment

## Supported model

The course release supports Docker Compose with two containers:

1. `web`: the Next.js application.
2. `postgres`: the PostgreSQL database.

This is the deployment represented in `diagrams.md`.

## Start

Create `.env`, set a strong `BETTER_AUTH_SECRET`, and run:

```bash
docker compose up --build -d
docker compose ps
```

Open `http://localhost:3000`.

## Stop

```bash
docker compose down
```

The named PostgreSQL volume keeps database data. Removing that volume destroys the project database and should not be part of normal operation.

## Demonstration checklist

- Application and database containers are healthy.
- Setup and admin login work.
- Seed/demo data is present.
- The test suite has been run before the presentation.
- A database backup or reset plan has been rehearsed.

Public hosting, HTTPS, reverse proxies, high availability, and serverless execution are future deployment concerns rather than MVP requirements.
