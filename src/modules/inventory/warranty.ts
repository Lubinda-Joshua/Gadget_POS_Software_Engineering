/**
 * Calculate warranty expiry without mutating the supplied sale date.
 * JavaScript's month rollover is clamped so a sale on 31 January with a
 * one-month warranty expires on the last day of February.
 */
export function calculateWarrantyExpiry(startsAt: Date, warrantyMonths: number): Date {
  if (!Number.isInteger(warrantyMonths) || warrantyMonths < 0) {
    throw new Error("Warranty months must be a non-negative whole number");
  }

  const expiry = new Date(startsAt);
  const originalDay = expiry.getUTCDate();
  expiry.setUTCDate(1);
  expiry.setUTCMonth(expiry.getUTCMonth() + warrantyMonths);
  const lastDay = new Date(
    Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth() + 1, 0)
  ).getUTCDate();
  expiry.setUTCDate(Math.min(originalDay, lastDay));
  return expiry;
}
