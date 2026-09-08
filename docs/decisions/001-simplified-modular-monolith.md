# ADR-001: Use a simplified modular monolith

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

The upstream application included offline browser storage, synchronization, plugins, internationalization, several cloud-storage providers, PWA behavior, and multiple deployment options. These features are useful in a commercial product but increase the number of failure modes and concepts the course team must defend. The project needs meaningful design depth without accidental infrastructure complexity.

## Decision

Use one Next.js application and one PostgreSQL database. Organize business behavior into internal modules for Identity, Catalog, Inventory, Sales, Customers, and Reporting. Support a single-server/Docker deployment and local image storage. Add serial/IMEI and warranty behavior as the primary gadget-specific contribution.

Remove offline synchronization, runtime plugins, PWA caching, multilingual loading, and cloud-storage adapters from the course baseline.

## Consequences

- The runtime and deployment diagrams are small enough to explain completely.
- Database transactions can protect sales and stock without distributed coordination.
- The team can focus on requirements, domain rules, data integrity, authorization, and tests.
- Checkout requires connectivity to the application server.
- Scaling to multiple stores or cloud object storage would require future design work.

## Alternatives considered

### Keep every upstream capability

Rejected because the team would inherit substantial complexity unrelated to the selected problem and could not credibly claim or explain all design decisions.

### Rewrite the application from nothing

Rejected because it would spend project time rebuilding routine authentication and UI scaffolding rather than demonstrating analysis and gadget-specific design.

### Use microservices

Rejected because there is no independent scaling, ownership, or deployment requirement that justifies network seams between the modules.
