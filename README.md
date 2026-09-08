# Gadget POS System

Gadget POS is a software-engineering course project for managing sales and inventory in a small gadget shop. The project deliberately uses a simple modular-monolith architecture: one web application, one PostgreSQL database, and a small set of business modules that the team can explain and test end to end.

## Project objective

The objective is not to build the largest possible POS. It is to demonstrate a disciplined development process from requirements and UML design through database design, implementation, testing, and evaluation.

The balanced MVP covers:

- ADMIN and CASHIER accounts.
- Product, supplier, and customer records.
- Barcode/SKU product search.
- Cart checkout with tax and discount calculations.
- Stock updates and an inventory adjustment history.
- Cash, card, or other payment.
- Receipts, sales history, refunds, and summary reports.
- A gadget-specific extension for serial/IMEI tracking and warranty records.
- Zambian kwacha (`K`) pricing and a representative gadget-shop demonstration catalog.

The serial/IMEI and warranty extension is implemented as a traced project iteration: administrators register physical gadget units, cashiers select one available unit during checkout, and the system creates a searchable warranty record in the same transaction. See [Requirements](docs/requirements.md).

## Deliberately excluded

To keep the system understandable, the first academic release excludes microservices, offline database synchronization, runtime plugins, cloud-storage adapters, multilingual UI, multi-store operation, accounting integrations, and predictive analytics. These can be discussed as future work without complicating the implemented architecture.

## Architecture at a glance

```text
Browser UI
    |
Next.js route handlers / server actions
    |
Catalog | Inventory | Sales | Users & Reports
    |
Prisma
    |
PostgreSQL
```

This is a modular monolith. Modules separate business responsibilities inside one deployable application. PostgreSQL transactions protect operations such as completing a sale and updating stock.

## Documentation

- [Project charter](docs/project-charter.md)
- [Requirements specification](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [UML and data diagrams](docs/diagrams.md)
- [Requirements traceability](docs/traceability.md)
- [Architecture decisions](docs/decisions/README.md)
- [Getting started](docs/getting-started.md)
- [Testing](docs/testing.md)

## Local development

Requirements: Node.js 20+, pnpm 9+, and PostgreSQL 14+.

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. The development seed provides `admin@example.com` / `admin123456` and `cashier@example.com` / `cashier123456` for local demonstration only.

## Attribution

The copyright and MIT licensing terms that apply to this project are retained in [LICENSE](LICENSE). Changes, requirements, diagrams, architecture decisions, and project-specific features are maintained by the Gadget POS course-project team.
