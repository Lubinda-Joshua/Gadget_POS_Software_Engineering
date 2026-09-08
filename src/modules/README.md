# Business modules

New and refactored business rules belong in this directory. Each module exposes a small interface that route handlers, server actions, and tests can call.

Planned module folders:

- `identity`
- `catalog`
- `inventory`
- `sales`
- `customers`
- `reporting`

Do not create a module that only passes arguments to Prisma. A module should own useful behavior such as validation, calculation, state transitions, and transaction coordination.
