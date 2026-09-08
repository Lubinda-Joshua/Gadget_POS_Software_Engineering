import { describe, it, expect } from "vitest";

// ── Loyalty calculation helpers ───────────────────────────────────────────────

/**
 * Calculate points earned for a purchase.
 * @param total       Sale total (after tax, before tip)
 * @param earnRate    Points earned per currency unit (e.g. 1 = 1 point per $1)
 */
function earnPoints(total: number, earnRate: number): number {
  return Math.floor(total * earnRate);
}

/**
 * Calculate the monetary value of redeemed points.
 * @param points       Points the customer wants to redeem
 * @param redeemRate   Currency value per point (e.g. 0.01 = $0.01 per point)
 * @param maxRedeemPct Maximum percentage of the order total that can be covered by points (0–1)
 * @param orderTotal   Order total to apply the cap against
 */
function redeemPoints(
  points: number,
  redeemRate: number,
  maxRedeemPct: number,
  orderTotal: number
): number {
  const rawValue = points * redeemRate;
  const cap = orderTotal * maxRedeemPct;
  return Math.min(rawValue, cap);
}

/**
 * Update points balance after a transaction.
 * - Earned points are added.
 * - Points redeemed are deducted (cannot go below 0).
 */
function updateBalance(current: number, earned: number, redeemed: number): number {
  return Math.max(0, current + earned - redeemed);
}

/**
 * Convert a monetary redemption amount to the number of points consumed.
 */
function monetaryToPoints(value: number, redeemRate: number): number {
  return Math.ceil(value / redeemRate);
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("loyalty point calculations", () => {
  describe("earnPoints", () => {
    it("earns 1 point per dollar by default", () => {
      expect(earnPoints(50, 1)).toBe(50);
    });

    it("floors fractional points", () => {
      // $15.99 × 1 = 15 points (floor)
      expect(earnPoints(15.99, 1)).toBe(15);
    });

    it("supports fractional earn rate (e.g. 0.5 pts per dollar)", () => {
      expect(earnPoints(100, 0.5)).toBe(50);
    });

    it("earns 0 points on a zero-total order", () => {
      expect(earnPoints(0, 1)).toBe(0);
    });

    it("earns 0 points with a zero earn rate (loyalty disabled)", () => {
      expect(earnPoints(100, 0)).toBe(0);
    });
  });

  describe("redeemPoints", () => {
    it("converts points to monetary value at the redeem rate", () => {
      // 100 points × $0.01/pt = $1.00
      expect(redeemPoints(100, 0.01, 1, 50)).toBeCloseTo(1.0);
    });

    it("caps redemption at the maxRedeemPct of order total", () => {
      // 10000 pts × $0.01 = $100, but cap = 50% of $50 = $25
      expect(redeemPoints(10000, 0.01, 0.5, 50)).toBeCloseTo(25);
    });

    it("allows 100% redemption when cap is 1", () => {
      expect(redeemPoints(1000, 0.01, 1, 5)).toBeCloseTo(5);
    });

    it("returns 0 when 0 points provided", () => {
      expect(redeemPoints(0, 0.01, 0.5, 100)).toBe(0);
    });
  });

  describe("updateBalance", () => {
    it("adds earned points to existing balance", () => {
      expect(updateBalance(100, 15, 0)).toBe(115);
    });

    it("deducts redeemed points from balance", () => {
      expect(updateBalance(200, 0, 50)).toBe(150);
    });

    it("handles earn and redeem in the same transaction", () => {
      expect(updateBalance(100, 20, 30)).toBe(90);
    });

    it("never goes below zero", () => {
      expect(updateBalance(10, 0, 50)).toBe(0);
    });
  });

  describe("monetaryToPoints", () => {
    it("converts $1.00 to 100 points at $0.01/pt", () => {
      expect(monetaryToPoints(1.0, 0.01)).toBe(100);
    });

    it("rounds up fractional point costs", () => {
      // $0.015 / $0.01 = 1.5 → ceil = 2 points
      expect(monetaryToPoints(0.015, 0.01)).toBe(2);
    });
  });

  describe("full loyalty flow", () => {
    it("earn on $50 purchase, then redeem partial balance on next", () => {
      const earnRate = 1; // 1 pt per $
      const redeemRate = 0.01; // $0.01 per pt
      const maxRedeemPct = 0.5;

      let balance = 0;

      // First purchase: $50
      const earned1 = earnPoints(50, earnRate); // 50 pts
      balance = updateBalance(balance, earned1, 0);
      expect(balance).toBe(50);

      // Second purchase: $30, redeem some points
      const redeemValue = redeemPoints(balance, redeemRate, maxRedeemPct, 30); // max $15
      expect(redeemValue).toBeCloseTo(0.5); // 50 pts × $0.01 = $0.50 (< $15 cap)
      const pointsUsed = monetaryToPoints(redeemValue, redeemRate); // 50 pts
      const earned2 = earnPoints(30, earnRate); // 30 pts
      balance = updateBalance(balance, earned2, pointsUsed);
      expect(balance).toBe(30); // 50 - 50 + 30
    });
  });
});
