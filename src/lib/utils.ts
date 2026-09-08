import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency using the business settings.
 * Uses Intl.NumberFormat for locale-aware thousand separators / decimal point.
 * The symbol is prepended (custom, not ISO code).
 */
export function formatCurrency(
  amount: number | string,
  symbol = "K",
  decimals = 2,
  locale = "en-ZM"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol}0.${"0".repeat(decimals)}`;
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
    return `${symbol}${formatted}`;
  } catch {
    return `${symbol}${num.toFixed(decimals)}`;
  }
}

/**
 * Format a date/time string in the user's locale.
 */
export function formatDate(
  date: Date | string | number,
  locale = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(
    locale,
    options ?? {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }
  ).format(d);
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
