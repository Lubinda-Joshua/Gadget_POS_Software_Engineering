# UML and data diagrams

These are living design models and use the same terms as `CONTEXT.md` and the implemented Prisma schema.

## System context

```mermaid
flowchart LR
    Cashier[Cashier] --> POS[Gadget POS]
    Admin[Administrator] --> POS
    POS --> Customer[Customer receipt and warranty]
    POS --> DB[(PostgreSQL database)]
    Scanner[Barcode/IMEI scanner] --> POS
    Printer[Receipt printer] <-- POS
```

## Main use cases

```mermaid
flowchart TB
    Cashier --> Login[Log in]
    Cashier --> Checkout[Complete sale]
    Cashier --> Receipt[Issue receipt]
    Admin --> Products[Manage products]
    Admin --> Stock[Adjust stock]
    Admin --> Device[Register serial/IMEI]
    Admin --> Refund[Refund sale]
    Admin --> Reports[View reports]
    Admin --> Users[Manage users]
    Checkout --> SelectDevice[Select available serialized gadget]
    Checkout --> Receipt
```

## Complete-sale sequence

```mermaid
sequenceDiagram
    actor Cashier
    participant UI as POS screen
    participant Route as Sale adapter
    participant Sales as Sales module
    participant Inventory as Inventory module
    participant DB as PostgreSQL

    Cashier->>UI: Confirm cart and payment
    UI->>Route: Submit CompleteSale command
    Route->>Sales: completeSale(command, user)
    Sales->>DB: Load products, settings, customer
    Sales->>Inventory: verifyAvailability(items)
    Inventory->>DB: Check stock and serialized-item state
    Sales->>Sales: Calculate totals and validate payment
    Sales->>DB: Begin transaction
    Sales->>DB: Create sale, lines, and payment
    Sales->>Inventory: recordSaleMovements(transaction)
    Inventory->>DB: Update stock and serialized items
    Sales->>DB: Commit transaction
    Sales-->>Route: Receipt result
    Route-->>UI: 201 Created and receipt
    UI-->>Cashier: Display or print receipt
```

## Domain class model

```mermaid
classDiagram
    User "1" --> "0..*" Sale : completes
    Supplier "1" --> "0..*" Product : supplies
    Product "1" --> "0..*" ProductUnit : identifies
    Product "1" --> "0..*" StockAdjustment : adjusted by
    Customer "1" --> "0..*" Sale : places
    Sale "1" *-- "1..*" SaleItem : contains
    Sale "1" --> "0..*" Refund : may have
    SaleItem "0..1" --> "0..1" ProductUnit : assigns
    SaleItem "1" --> "0..1" Warranty : creates

    Product {
      string id
      string name
      string sku
      decimal price
      int stock
      ProductTrackingMode trackingMode
      int warrantyMonths
    }
    ProductUnit {
      string id
      string serialNumber
      string imei
      ProductUnitStatus status
    }
    Sale {
      string id
      decimal subtotal
      decimal taxAmount
      decimal total
      SaleStatus status
      datetime createdAt
    }
    SaleItem {
      string id
      string productName
      decimal unitPrice
      int quantity
    }
    Warranty {
      string id
      datetime startsAt
      datetime expiresAt
      WarrantyStatus status
    }
```

## Serialized-item lifecycle

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE: Receive or register
    AVAILABLE --> SOLD: Complete sale
    SOLD --> AVAILABLE: Refund and restore stock
```

## Deployment

```mermaid
flowchart LR
    Browser[Shop browser] -->|HTTP on local network| App[Next.js container]
    Scanner[USB barcode scanner] --> Browser
    App -->|Prisma PostgreSQL protocol| DB[(PostgreSQL container)]
    App --> Files[(Local image directory)]
    Browser --> Printer[Receipt printer or browser print]
```

## Diagram review checklist

Before submission, verify that entity names match Prisma, message names match implemented module interfaces, states match validation rules, and every arrow represents a real dependency or interaction.
