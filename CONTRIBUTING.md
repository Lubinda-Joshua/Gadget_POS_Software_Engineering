# Contributing

## Workflow

1. Select a requirement ID from `docs/requirements.md`.
2. Write or refine its acceptance criteria.
3. Update the relevant diagram or architecture decision before implementation.
4. Create a short-lived branch such as `feature/FR-INV-04-serial-registration`.
5. Implement the smallest vertical slice and its tests.
6. Update `docs/traceability.md`.
7. Open a pull request and ask another team member to review it.

## Definition of done

A change is done when its requirement is clear, design and schema are consistent, server rules are enforced, tests pass, documentation is current, and another team member can explain it.

## Code rules

- Use strict TypeScript and Zod at input points.
- Keep business rules out of React views.
- Put new business behavior behind a small interface in `src/modules`.
- Treat browser values as untrusted.
- Use Prisma transactions for workflows that update more than one related record.
- Do not add a library when a short, clear local implementation is sufficient.
- Do not commit `.env`, generated Prisma code, build output, or uploaded images.

## Commit format

Use `type(scope): description`, for example:

```text
feat(inventory): register serialized gadgets
test(sales): reject insufficient stock
docs(requirements): clarify refund authorization
```
