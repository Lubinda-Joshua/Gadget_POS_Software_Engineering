import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const refundSchema = z.object({
  reason: z.string().optional(),
  restoreStock: z.boolean().default(true),
  items: z
    .array(
      z.object({
        saleItemId: z.string(),
        productId: z.string().nullable().optional(),
        name: z.string(),
        quantity: z.number().int().min(1),
        price: z.number(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: saleId } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { warranty: true } } },
  });
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  if (sale.status !== "COMPLETED")
    return NextResponse.json({ error: "Sale is not refundable" }, { status: 400 });

  const body = await req.json();
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { reason, restoreStock, items } = parsed.data;
  const refundAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const refund = await prisma.$transaction(async (tx) => {
    const r = await tx.refund.create({
      data: {
        saleId,
        userId: session.user.id,
        amount: refundAmount,
        reason: reason || null,
        items: items,
        restoreStock,
      },
    });

    // Update sale status
    await tx.sale.update({ where: { id: saleId }, data: { status: "REFUNDED" } });

    // Restore stock
    if (restoreStock) {
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        const original = sale.items.find((saleItem) => saleItem.id === item.saleItemId);
        if (original?.unitId) {
          await tx.productUnit.update({
            where: { id: original.unitId },
            data: { status: "AVAILABLE" },
          });
          if (original.warranty) {
            await tx.warranty.update({
              where: { id: original.warranty.id },
              data: { status: "VOIDED" },
            });
          }
        }
      }
    }

    return r;
  });

  return NextResponse.json({ refund });
}
