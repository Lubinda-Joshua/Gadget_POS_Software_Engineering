# Software requirements specification

Status values are **Baseline** (present in the inherited application), **Improve** (present but must be strengthened), and **Planned** (course-team implementation).

## Actors

- **Cashier:** performs sales and views permitted sales records.
- **Administrator:** performs cashier work and manages catalog, stock, users, refunds, settings, and reports.
- **Customer:** receives products, receipts, refunds, and warranty evidence but does not log in.

## Functional requirements

| ID         | Requirement                                                                                                              | Priority | Status      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | -------: | ----------- |
| FR-AUTH-01 | The system shall authenticate users by email and password.                                                               |     Must | Baseline    |
| FR-AUTH-02 | The system shall restrict administrative operations to ADMIN users.                                                      |     Must | Improve     |
| FR-CAT-01  | An administrator shall create and update products with name, SKU/barcode, price, cost, category, and supplier.           |     Must | Baseline    |
| FR-CAT-02  | A cashier shall find an active product by name, SKU, or barcode.                                                         |     Must | Baseline    |
| FR-INV-01  | An administrator shall record stock receipts, damage, theft, opening count, and corrections.                             |     Must | Baseline    |
| FR-INV-02  | Every stock adjustment shall record the product, quantity change, reason, user, and time.                                |     Must | Improve     |
| FR-INV-03  | The system shall reject a sale when insufficient saleable stock exists.                                                  |     Must | Improve     |
| FR-INV-04  | An administrator shall register a gadget using a unique serial number or IMEI.                                           |     Must | Implemented |
| FR-INV-05  | The system shall prevent one serialized gadget from being sold more than once.                                           |     Must | Implemented |
| FR-SALE-01 | A cashier shall add products, change quantities, and remove products from a cart.                                        |     Must | Baseline    |
| FR-SALE-02 | The server shall calculate the sale using current product prices and configured tax.                                     |     Must | Improve     |
| FR-SALE-03 | The system shall accept one payment method per MVP sale: cash, card, or other.                                           |     Must | Improve     |
| FR-SALE-04 | Completing a sale and reducing stock shall succeed or fail as one transaction.                                           |     Must | Improve     |
| FR-SALE-05 | The system shall produce a receipt containing sale, cashier, item, tax, payment, and total details.                      |     Must | Baseline    |
| FR-RET-01  | An administrator shall issue a full or partial refund with a reason.                                                     |   Should | Baseline    |
| FR-RET-02  | A refund that restores inventory shall create a traceable inventory movement.                                            |   Should | Improve     |
| FR-CUS-01  | An authorized user shall create and update customer records.                                                             |   Should | Baseline    |
| FR-WAR-01  | A sold serialized gadget shall have a warranty start date and expiry date.                                               |   Should | Implemented |
| FR-WAR-02  | An authorized user shall find warranty information by serial number, IMEI, receipt, or customer.                         |   Should | Implemented |
| FR-REP-01  | An administrator shall view sales totals, transaction count, payment breakdown, and low-stock products for a date range. |   Should | Baseline    |

## Non-functional requirements

| ID          | Requirement                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------- |
| NFR-SEC-01  | Protected operations shall validate the server session and required role.                          |
| NFR-SEC-02  | Secrets and password credentials shall not be stored in source control.                            |
| NFR-REL-01  | Sale, refund, and inventory workflows shall preserve database consistency when an operation fails. |
| NFR-PERF-01 | Product search shall normally return within two seconds on the course demonstration dataset.       |
| NFR-USA-01  | A trained cashier shall complete a standard sale without navigating away from the POS screen.      |
| NFR-MNT-01  | Core business rules shall be testable through module interfaces without rendering the UI.          |
| NFR-TRC-01  | Every must-have requirement shall link to its design, implementation, and verification evidence.   |
| NFR-DEP-01  | The system shall run locally using documented prerequisites or Docker Compose.                     |

## Business rules

| ID    | Rule                                                                       |
| ----- | -------------------------------------------------------------------------- |
| BR-01 | Stock cannot become negative through a completed sale.                     |
| BR-02 | Product prices, tax, and authorization are determined by the server.       |
| BR-03 | Cash tendered must cover the total; non-cash payment must equal the total. |
| BR-04 | Serial numbers and IMEIs are globally unique when supplied.                |
| BR-05 | Only an item in AVAILABLE state may be assigned to a sale.                 |
| BR-06 | A refund cannot exceed the unrefunded value of the original sale.          |
| BR-07 | An administrator must supply a reason for stock corrections and refunds.   |

## Assumptions and constraints

- The MVP supports one physical shop and one PostgreSQL database.
- Internet-independent checkout is outside scope; the local network and server must be available.
- Card payments are recorded, not processed through a bank gateway.
- The MVP uses Zambian kwacha with the `K` display symbol and two decimal places; statutory tax behavior must be confirmed with the project stakeholder.
- Barcode scanners behave like keyboard input devices.

## Acceptance method

Must-have requirements require an automated test where practical and a documented demonstration scenario. Changes to scope require an architecture decision or an updated charter approved by the team.
