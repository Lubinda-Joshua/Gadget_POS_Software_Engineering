# Requirements traceability matrix

This matrix starts the project baseline. `TBD` means the planned design or implementation has not been completed and must not be claimed in a demonstration.

| Requirement | Design evidence                         | Implementation evidence                                      | Verification evidence                                          |
| ----------- | --------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| FR-AUTH-01  | Architecture: Identity module           | `src/lib/auth.ts`                                            | `src/tests/e2e/auth.spec.ts`                                   |
| FR-AUTH-02  | Architecture: Security                  | Page and route role checks                                   | Admin/cashier cases in `auth.spec.ts`; authorization audit TBD |
| FR-CAT-01   | Domain class model: Product             | Product pages/actions, Prisma `Product`                      | `src/tests/e2e/products.spec.ts`                               |
| FR-CAT-02   | Complete-sale interaction               | Product-search route and screen                              | Product search E2E case                                        |
| FR-INV-01   | Inventory module                        | Stock-adjustment route and model                             | Integration test TBD                                           |
| FR-INV-03   | Checkout rules                          | Current sale route; Sales-module refactor TBD                | Insufficient-stock integration test TBD                        |
| FR-INV-04   | Product-unit class model                | Product-unit API, product detail panel, Prisma `ProductUnit` | API integration test TBD                                       |
| FR-INV-05   | Product-unit state diagram              | Transactional unit state check in sales route                | Duplicate-sale integration test TBD                            |
| FR-SALE-01  | Main use cases                          | Cart store and POS screen                                    | `src/tests/cart.test.ts`, sales E2E                            |
| FR-SALE-02  | Checkout rules and sequence             | Sales module TBD                                             | Server-price tampering test TBD                                |
| FR-SALE-04  | Complete-sale sequence                  | Prisma transaction in sale route; refactor TBD               | Transaction rollback test TBD                                  |
| FR-SALE-05  | Complete-sale sequence                  | Receipt components                                           | `src/tests/e2e/receipt.spec.ts`                                |
| FR-RET-01   | Sale relationships                      | Refund route and modal                                       | `src/tests/refund.test.ts`                                     |
| FR-WAR-01   | Domain model and product-unit lifecycle | Transactional `Warranty` creation, warranty module           | `src/tests/warranty.test.ts`                                   |
| FR-WAR-02   | Warranty register use case              | Warranties page and nested sale/customer query               | Demonstration scenario; E2E test TBD                           |
| FR-REP-01   | Reporting module                        | Reports route and dashboard                                  | Report integration test TBD                                    |

Update this file whenever a requirement, interface, model, or test changes.
