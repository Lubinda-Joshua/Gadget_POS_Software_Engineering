/**
 * Serialize Prisma query results for safe passing to Client Components.
 *
 * Converts all Prisma `Decimal` objects → plain `number` via a JSON
 * round-trip reviver so that no Decimal wrappers ever reach the RSC
 * serialization boundary, regardless of Turbopack cache state.
 *
 * Usage:
 *   const products = serialize(await prisma.product.findMany(...));
 */
export function serialize<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      // Prisma Decimal instances have a constructor named "Decimal"
      if (value !== null && typeof value === "object" && value.constructor?.name === "Decimal") {
        return Number(value);
      }
      return value;
    })
  ) as T;
}
