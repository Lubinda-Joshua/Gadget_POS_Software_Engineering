# Gadget POS domain language

This glossary defines the business words used consistently in requirements, diagrams, screens, and code for the single-shop Gadget POS system.

## Catalog and inventory

**Product**:
A sellable product type, such as “Samsung Galaxy A55 128 GB” or “USB-C charger”.
_Avoid_: Item, gadget

**Quantity-tracked product**:
A product whose interchangeable stock is represented only by a count, such as cables or screen protectors.
_Avoid_: Normal product, bulk item

**Serialized product**:
A product for which every physical unit must be identified before sale, such as a phone or laptop.
_Avoid_: Unique product, serial item

**Product unit**:
One physical instance of a serialized product, identified by a serial number, an IMEI, or both.
_Avoid_: Serialized item, device record

**Available unit**:
A product unit that is in stock and may be assigned to a sale.
_Avoid_: Active unit, free unit

## Sales and after-sales

**Sale**:
A completed checkout transaction recorded by a cashier for one or more products.
_Avoid_: Order, invoice

**Sale item**:
One line within a sale; a serialized sale item identifies exactly one product unit.
_Avoid_: Order line, product line

**Warranty**:
The coverage period created for a sold serialized product unit, beginning at sale completion and ending after the product’s configured number of warranty months.
_Avoid_: Guarantee record

**Refund**:
A reversal of value from a completed sale; when stock is restored, an associated serialized product unit becomes available and its warranty is voided.
_Avoid_: Cancellation, return
