# Testing strategy

The test suite has three purposeful levels.

| Level | Verifies | Examples |
|---|---|---|
| Unit | Pure calculations and state transitions | Cart totals, refund limits, warranty expiry |
| Integration | Business module behavior with the database | Complete sale, reject stock shortage, assign serial number |
| End to end | A small number of critical user journeys | Login, product creation, checkout, receipt, refund |

## Commands

```bash
pnpm test --run
pnpm lint
pnpm build
pnpm test:e2e
```

End-to-end tests require the configured test database and Playwright Chromium installation.

## Test design rules

- Name tests after observable behavior or a requirement ID.
- Test business modules through their public interfaces.
- Do not test private implementation details.
- Include valid behavior, authorization failure, validation failure, and transaction rollback.
- A defect fix begins with a test that demonstrates the defect.
- Update `docs/traceability.md` when a test satisfies a requirement.

## Priority scenarios

1. Cashier and administrator authorization.
2. Server-authoritative product price and tax calculation.
3. Insufficient-stock rejection.
4. Atomic creation of sale, lines, payment, and inventory movements.
5. Unique serial/IMEI registration and assignment.
6. Prevention of duplicate serialized-item sales.
7. Refund amount and stock-restoration rules.
