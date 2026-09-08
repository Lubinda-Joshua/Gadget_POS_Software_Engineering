import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const adjustSchema = z.object({
  productId: z.string(),
  delta: z.number().int(),
  reason: z.enum(["RECEIVED", "DAMAGED", "THEFT", "CORRECTION", "OPENING_COUNT"]),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { productId, delta, reason, note } = parsed.data;

  const [adjustment] = await prisma.$transaction([
    prisma.stockAdjustment.create({
      data: { productId, userId: session.user.id, delta, reason, note },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: delta } },
    }),
  ]);

  return NextResponse.json({ adjustment });
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("productId");

  const adjustments = await prisma.stockAdjustment.findMany({
    where: productId ? { productId } : undefined,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ adjustments });
}
