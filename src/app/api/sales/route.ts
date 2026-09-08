import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateWarrantyExpiry } from "@/modules/inventory/warranty";

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().int().min(1),
        unitId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1),
  paymentMethod: z.enum(["CASH", "CARD", "OTHER"]).default("CASH"),
  amountTendered: z.number().optional(),
  paymentLines: z
    .array(
      z.object({
        method: z.enum(["CASH", "CARD", "OTHER"]),
        amount: z.number().min(0),
      })
    )
    .optional(),
  tipAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(1).default(0),
  discountAmount: z.number().min(0).default(0),
  discountType: z.enum(["fixed", "percent"]).default("fixed"),
  note: z.string().optional(),
  customerId: z.string().optional(),
  /** Loyalty points to redeem as discount (0 = no redemption) */
  loyaltyPointsUsed: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    items,
    paymentMethod,
    amountTendered,
    paymentLines,
    tipAmount,
    taxRate,
    discountAmount,
    discountType,
    note,
    customerId,
    loyaltyPointsUsed,
  } = parsed.data;

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productById = new Map(products.map((product) => [product.id, product]));
  const unitIds = items.flatMap((item) => (item.unitId ? [item.unitId] : []));
  if (new Set(unitIds).size !== unitIds.length) {
    return NextResponse.json(
      { error: "A serialized unit can appear only once in a sale" },
      { status: 400 }
    );
  }
  const units = await prisma.productUnit.findMany({ where: { id: { in: unitIds } } });
  const unitById = new Map(units.map((unit) => [unit.id, unit]));

  const requestedByProduct = new Map<string, number>();
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || !product.active) {
      return NextResponse.json({ error: `${item.name} is not available` }, { status: 409 });
    }
    if (product.trackingMode === "SERIALIZED") {
      const unit = item.unitId ? unitById.get(item.unitId) : undefined;
      if (
        !unit ||
        unit.productId !== product.id ||
        unit.status !== "AVAILABLE" ||
        item.quantity !== 1
      ) {
        return NextResponse.json(
          { error: `Select an available serial/IMEI for ${product.name}` },
          { status: 409 }
        );
      }
    } else if (item.unitId) {
      return NextResponse.json({ error: `${product.name} is not serial-tracked` }, { status: 400 });
    }
    requestedByProduct.set(product.id, (requestedByProduct.get(product.id) ?? 0) + item.quantity);
  }

  for (const [productId, quantity] of requestedByProduct) {
    const product = productById.get(productId)!;
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}` },
        { status: 409 }
      );
    }
  }

  const saleItems = items.map((item) => {
    const product = productById.get(item.productId)!;
    return {
      ...item,
      name: product.name,
      price: Number(product.price),
      warrantyMonths: product.warrantyMonths,
    };
  });

  // Derive primary paymentMethod from largest split-tender line (if split mode)
  const effectiveMethod: "CASH" | "CARD" | "OTHER" =
    paymentLines && paymentLines.length > 0
      ? (paymentLines.reduce((a, b) => (a.amount >= b.amount ? a : b)).method as
          "CASH" | "CARD" | "OTHER")
      : paymentMethod;

  // Load loyalty settings if customer is attached
  let loyaltySettings: { enabled: boolean; earnRate: number; redeemValue: number } | null = null;
  if (customerId) {
    const settings = await prisma.businessSettings.findUnique({ where: { id: "singleton" } });
    if (settings?.loyaltyEnabled) {
      loyaltySettings = {
        enabled: true,
        earnRate: parseFloat(settings.loyaltyEarnRate.toString()),
        redeemValue: parseFloat(settings.loyaltyRedeemValue.toString()),
      };
    }
  }

  const subtotal = saleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountValue =
    discountType === "percent"
      ? (subtotal * discountAmount) / 100
      : Math.min(discountAmount, subtotal);
  // Loyalty redemption discount (points / redeemValue = $ discount)
  const loyaltyDiscount =
    loyaltySettings && loyaltyPointsUsed > 0 ? loyaltyPointsUsed / loyaltySettings.redeemValue : 0;
  const totalDiscount = discountValue + loyaltyDiscount;
  const taxAmt = (subtotal - totalDiscount) * taxRate;
  const total = subtotal - totalDiscount + taxAmt + (tipAmount ?? 0);

  // Change due: cash single-method or from split lines total
  const paidTotal =
    paymentLines && paymentLines.length > 0
      ? paymentLines.reduce((s, p) => s + p.amount, 0)
      : (amountTendered ?? 0);
  const changeDue =
    effectiveMethod === "CASH" || paymentLines?.some((p) => p.method === "CASH")
      ? Math.max(0, paidTotal - total)
      : undefined;

  if (paymentLines?.length && paidTotal + 0.005 < total) {
    return NextResponse.json({ error: "Payment does not cover the sale total" }, { status: 400 });
  }
  if (
    !paymentLines?.length &&
    effectiveMethod === "CASH" &&
    (amountTendered ?? total) + 0.005 < total
  ) {
    return NextResponse.json(
      { error: "Cash tendered does not cover the sale total" },
      { status: 400 }
    );
  }

  const soldAt = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sale = await prisma.$transaction(async (tx: any) => {
    const created = await tx.sale.create({
      data: {
        userId: session.user.id,
        customerId: customerId || undefined,
        subtotal,
        taxRate,
        taxAmount: taxAmt,
        discountAmount: totalDiscount,
        tipAmount: tipAmount ?? 0,
        total,
        paymentMethod: effectiveMethod,
        paymentLines: paymentLines && paymentLines.length > 0 ? paymentLines : undefined,
        amountTendered: amountTendered ?? (paidTotal > 0 ? paidTotal : undefined),
        changeDue,
        notes: note,
        items: {
          create: saleItems.map((i) => ({
            productId: i.productId,
            unitId: i.unitId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            total: i.price * i.quantity,
            notes: i.notes ?? undefined,
            warranty:
              i.unitId && i.warrantyMonths > 0
                ? {
                    create: {
                      startsAt: soldAt,
                      expiresAt: calculateWarrantyExpiry(soldAt, i.warrantyMonths),
                    },
                  }
                : undefined,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement stock
    for (const [productId, quantity] of requestedByProduct) {
      const updated = await tx.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (updated.count !== 1)
        throw new Error("Stock changed during checkout; review the cart and try again");
    }

    for (const item of saleItems) {
      if (!item.unitId) continue;
      const updated = await tx.productUnit.updateMany({
        where: { id: item.unitId, productId: item.productId, status: "AVAILABLE" },
        data: { status: "SOLD" },
      });
      if (updated.count !== 1) throw new Error("A selected serialized unit is no longer available");
    }

    // Loyalty points: deduct redeemed, award earned
    if (customerId && loyaltySettings?.enabled) {
      const earnedPoints = Math.floor(total * loyaltySettings.earnRate);
      type LogEntry = {
        customerId: string;
        saleId: string;
        delta: number;
        type: "EARN" | "REDEEM" | "ADJUST";
        note: string;
      };
      const logs: LogEntry[] = [];

      if (loyaltyPointsUsed > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { decrement: loyaltyPointsUsed } },
        });
        logs.push({
          customerId,
          saleId: created.id,
          delta: -loyaltyPointsUsed,
          type: "REDEEM" as const,
          note: `Redeemed ${loyaltyPointsUsed} pts`,
        });
      }
      if (earnedPoints > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { increment: earnedPoints } },
        });
        logs.push({
          customerId,
          saleId: created.id,
          delta: earnedPoints,
          type: "EARN" as const,
          note: `Earned on sale`,
        });
      }
      for (const log of logs) {
        await tx.loyaltyLog.create({ data: log });
      }
    }

    return created;
  });

  return NextResponse.json({ sale }, { status: 201 });
}
