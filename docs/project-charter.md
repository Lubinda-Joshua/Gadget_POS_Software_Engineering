# Project charter

## Problem statement

Small gadget shops need a reliable way to record sales, know which devices are in stock, identify individual high-value devices, and provide evidence of warranty coverage. Paper records and generic stock counters make it difficult to trace an individual device by serial number or IMEI.

## Objective

Design and implement an understandable POS system that demonstrates requirements engineering, domain and database modeling, architecture, implementation, testing, and traceability.

## Stakeholders

| Stakeholder | Need |
|---|---|
| Cashier | Find products and complete an accurate sale quickly |
| Administrator/manager | Manage users, products, prices, inventory, refunds, and reports |
| Stock clerk | Record received, damaged, missing, or corrected stock |
| Customer | Receive an accurate receipt and warranty evidence |
| Course lecturer | Verify that design choices are justified and reflected in the implementation |
| Project team | Maintain a system each member can explain and test |

## Scope

The MVP includes one shop, one currency, two user roles, product and party records, checkout, inventory movements, refunds, reports, and serial/IMEI tracking for serialized gadgets.

The MVP does not include microservices, offline checkout, multiple branches, online payments, accounting integration, e-commerce, AI forecasting, or runtime extensions.

## Success criteria

1. A cashier can complete a valid sale and stock is updated atomically.
2. Invalid payment, price, stock, role, and serial-number operations are rejected by the server.
3. An administrator can trace a serialized gadget from receipt into stock through sale or return.
4. Every must-have requirement links to a design element, implementation location, and test.
5. Every team member can explain the system context, module structure, main data relationships, and checkout sequence.

## Delivery approach

Work in vertical iterations: requirements and acceptance criteria, diagram update, schema/module implementation, interface adapter and UI, automated tests, and demonstration evidence. A feature is not complete when only its screen works.
