import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Explicit field allow-list — never expose cost, supplierId, or timestamps
// to this client-facing endpoint.
const PRODUCT_SELECT = {
  id: true,
  name: true,
  price: true,
  stock: true,
  sku: true,
  barcode: true,
  category: true,
  imageUrl: true,
  trackingMode: true,
  warrantyMonths: true,
} as const;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function parseLimit(req: NextRequest): number {
  const raw = Number(req.nextUrl.searchParams.get("limit"));
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT;
  return Math.min(raw, MAX_LIMIT);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const take = parseLimit(req);

  if (!q.trim()) {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: PRODUCT_SELECT,
      orderBy: { name: "asc" },
      take,
    });
    return NextResponse.json(
      products.map((p: (typeof products)[number]) => ({
        ...p,
        price: parseFloat(p.price.toString()),
      }))
    );
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { equals: q } },
        {
          units: {
            some: { serialNumber: { equals: q, mode: "insensitive" }, status: "AVAILABLE" },
          },
        },
        { units: { some: { imei: { equals: q }, status: "AVAILABLE" } } },
      ],
    },
    select: PRODUCT_SELECT,
    take,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    products.map((p: (typeof products)[number]) => ({
      ...p,
      price: parseFloat(p.price.toString()),
    }))
  );
}
