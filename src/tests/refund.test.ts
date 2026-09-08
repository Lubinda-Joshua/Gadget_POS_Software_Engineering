import { describe, it, expect } from "vitest";

// ── Refund calculation helpers ──────────────────────────────────────────────

/** Returns the maximum refundable amount for an item (price × qty). */
function itemRefundMax(price: number, quantity: number): number {
  return price * quantity;
}

/** Ensures a refund amount is within bounds [0, saleTotal]. */
function clampRefund(amount: number, saleTotal: number): number {
  return Math.min(Math.max(0, amount), saleTotal);
}

/**
 * Given a list of already-refunded amounts and the current refund request,
 * returns the total amount that would be refunded after this action.
 */
function totalRefunded(existing: number[], requested: number): number {
  return existing.reduce((sum, r) => sum + r, 0) + requested;
}

/** True if the total amount refunded does not exceed the original sale total. */
function isRefundValid(existing: number[], requested: number, saleTotal: number): boolean {
  return totalRefunded(existing, requested) <= saleTotal + 0.0001; // fp tolerance
}

// ── Suite ────────────────────────────────────────────────────────────────────

describe("refund calculations", () => {
  describe("itemRefundMax", () => {
    it("returns price × quantity for a standard item", () => {
      expect(itemRefundMax(10, 2)).toBe(20);
    });

    it("handles single-unit items", () => {
      expect(itemRefundMax(5.99, 1)).toBeCloseTo(5.99);
    });

    it("handles decimal quantities (e.g. kg)", () => {
      expect(itemRefundMax(4.0, 0.5)).toBeCloseTo(2.0);
    });
  });

  describe("clampRefund", () => {
    it("returns the amount when within bounds", () => {
      expect(clampRefund(10, 50)).toBe(10);
    });

    it("caps at saleTotal for full refund", () => {
      expect(clampRefund(100, 50)).toBe(50);
    });

    it("clamps negative amounts to 0", () => {
      expect(clampRefund(-5, 50)).toBe(0);
    });
  });

  describe("partial refund flow", () => {
    const saleTotal = 75.0;

    it("allows a partial refund", () => {
      expect(isRefundValid([], 25, saleTotal)).toBe(true);
    });

    it("allows a full refund", () => {
      expect(isRefundValid([], 75, saleTotal)).toBe(true);
    });

    it("rejects a refund exceeding the sale total", () => {
      expect(isRefundValid([], 80, saleTotal)).toBe(false);
    });

    it("allows a second partial refund when total does not exceed sale", () => {
      expect(isRefundValid([25], 40, saleTotal)).toBe(true);
    });

    it("rejects a second partial refund that would exceed the sale", () => {
      expect(isRefundValid([50], 30, saleTotal)).toBe(false);
    });

    it("allows refunding the remaining balance exactly", () => {
      expect(isRefundValid([25, 25], 25, saleTotal)).toBe(true);
    });
  });

  describe("totalRefunded", () => {
    it("sums existing refunds + requested amount", () => {
      expect(totalRefunded([10, 15], 5)).toBe(30);
    });

    it("returns just the requested amount when no prior refunds", () => {
      expect(totalRefunded([], 20)).toBe(20);
    });
  });
});
