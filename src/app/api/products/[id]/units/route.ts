import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const unitSchema = z
  .object({
    serialNumber: z.string().trim().max(100).optional(),
    imei: z.string().trim().max(20).optional(),
  })
  .refine((value) => Boolean(value.serialNumber || value.imei), {
    message: "Enter a serial number, an IMEI, or both",
  });

async function session() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const current = await session();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const units = await prisma.productUnit.findMany({
    where: { productId: id, status: "AVAILABLE" },
    select: { id: true, serialNumber: true, imei: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const current = await session();
  if (!current || current.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const parsed = unitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { id: productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { trackingMode: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.trackingMode !== "SERIALIZED") {
    return NextResponse.json({ error: "This product is quantity-tracked" }, { status: 400 });
  }

  try {
    const unit = await prisma.$transaction(async (tx) => {
      const created = await tx.productUnit.create({
        data: {
          productId,
          serialNumber: parsed.data.serialNumber || null,
          imei: parsed.data.imei || null,
        },
      });
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: 1 } },
      });
      return created;
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "That serial number or IMEI is already registered" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not register the product unit" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const current = await session();
  if (!current || current.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id: productId } = await params;
  const body = z.object({ unitId: z.string().min(1) }).safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid unit" }, { status: 400 });

  const removed = await prisma.$transaction(async (tx) => {
    const deleted = await tx.productUnit.deleteMany({
      where: { id: body.data.unitId, productId, status: "AVAILABLE" },
    });
    if (deleted.count === 1) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } },
      });
    }
    return deleted.count;
  });

  if (!removed) {
    return NextResponse.json({ error: "Only an available unit can be removed" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
