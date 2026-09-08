import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// ---- GET /api/customers?q=search&page=1&limit=20 ----
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } as const },
          { phone: { contains: q, mode: "insensitive" } as const },
          { email: { contains: q, mode: "insensitive" } as const },
        ],
      }
    : undefined;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      select: { id: true, name: true, phone: true, email: true, loyaltyPoints: true, notes: true, createdAt: true },
    }),
    prisma.customer.count({ where }),
  ]);

  // Enrich with sales stats
  const customerIds = customers.map((c) => c.id);
  const salesStats = await prisma.sale.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customerIds }, status: "COMPLETED" },
    _sum: { total: true },
    _max: { createdAt: true },
    _count: { id: true },
  });

  const enriched = customers.map((c) => {
    const stat = salesStats.find((s) => s.customerId === c.id);
    return {
      ...c,
      totalSpend: stat?._sum.total?.toNumber() ?? 0,
      lastVisit: stat?._max.createdAt ?? null,
      visitCount: stat?._count.id ?? 0,
    };
  });

  return NextResponse.json({
    customers: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ---- POST /api/customers (quick-create) ----
const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, email, notes } = parsed.data;

  try {
    const customer = await prisma.customer.create({
      data: { name, phone: phone || null, email: email || null, notes: notes || null },
      select: { id: true, name: true, phone: true, email: true },
    });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Phone or email already in use" }, { status: 409 });
    }
    throw e;
  }
}
