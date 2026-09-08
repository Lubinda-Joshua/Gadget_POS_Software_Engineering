import { describe, it, expect } from "vitest";

// Cart calculation helpers (pure functions extracted from store)
function subtotal(items: { price: number; quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function discountValue(
  sub: number,
  amount: number,
  type: "fixed" | "percent"
) {
  if (type === "percent") return (sub * amount) / 100;
  return Math.min(amount, sub);
}

function taxAmount(sub: number, disc: number, taxRate: number) {
  return (sub - disc) * taxRate;
}

function total(sub: number, disc: number, tax: number) {
  return sub - disc + tax;
}

describe("cart calculations", () => {
  const items = [
    { price: 10, quantity: 2 }, // 20
    { price: 5.5, quantity: 1 }, // 5.50
  ];

  it("calculates subtotal correctly", () => {
    expect(subtotal(items)).toBe(25.5);
  });

  it("applies fixed discount", () => {
    const sub = subtotal(items);
    expect(discountValue(sub, 5, "fixed")).toBe(5);
  });

  it("applies percent discount", () => {
    const sub = subtotal(items);
    expect(discountValue(sub, 10, "percent")).toBeCloseTo(2.55);
  });

  it("caps fixed discount at subtotal", () => {
    expect(discountValue(25.5, 100, "fixed")).toBe(25.5);
  });

  it("calculates tax on discounted subtotal", () => {
    const sub = subtotal(items);
    const disc = discountValue(sub, 5, "fixed"); // 5
    expect(taxAmount(sub, disc, 0.1)).toBeCloseTo(2.05); // (25.5 - 5) * 0.1
  });

  it("calculates total", () => {
    const sub = subtotal(items);
    const disc = discountValue(sub, 5, "fixed");
    const tax = taxAmount(sub, disc, 0.1);
    expect(total(sub, disc, tax)).toBeCloseTo(22.55);
  });
});
