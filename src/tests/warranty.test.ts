import { describe, expect, it } from "vitest";
import { calculateWarrantyExpiry } from "@/modules/inventory/warranty";

describe("calculateWarrantyExpiry", () => {
  it("adds the configured number of months", () => {
    const start = new Date("2026-04-15T10:30:00.000Z");
    expect(calculateWarrantyExpiry(start, 12).toISOString()).toBe("2027-04-15T10:30:00.000Z");
  });

  it("clamps month-end dates", () => {
    const start = new Date("2026-01-31T10:30:00.000Z");
    expect(calculateWarrantyExpiry(start, 1).toISOString()).toBe("2026-02-28T10:30:00.000Z");
  });

  it("rejects negative or fractional month counts", () => {
    expect(() => calculateWarrantyExpiry(new Date(), -1)).toThrow();
    expect(() => calculateWarrantyExpiry(new Date(), 1.5)).toThrow();
  });
});
