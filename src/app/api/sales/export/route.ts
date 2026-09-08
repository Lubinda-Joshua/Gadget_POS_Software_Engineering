import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const rows: string[] = [
    [
      "Sale ID",
      "Date",
      "Status",
      "Payment Method",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
      "Items",
    ].join(","),
  ];

  for (const sale of sales) {
    const itemsSummary = sale.items
      .map((i: typeof sale.items[number]) => `${i.quantity}x ${i.product?.name ?? i.name}`)
      .join("; ");

    rows.push(
      [
        sale.id,
        sale.createdAt.toISOString(),
        sale.status,
        sale.paymentMethod,
        sale.subtotal.toFixed(2),
        sale.discountAmount.toFixed(2),
        sale.taxAmount.toFixed(2),
        sale.total.toFixed(2),
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(",")
    );
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sales-export-${Date.now()}.csv"`,
    },
  });
}
