import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET /api/loyalty?customerId=... — get balance */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

  const [customer, settings] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, loyaltyPoints: true },
    }),
    prisma.businessSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({
    points: customer.loyaltyPoints,
    enabled: settings?.loyaltyEnabled ?? false,
    earnRate: parseFloat((settings?.loyaltyEarnRate ?? 1).toString()),
    redeemValue: parseFloat((settings?.loyaltyRedeemValue ?? 100).toString()),
    // Dollar discount if they redeem all points
    maxRedeemDiscount: customer.loyaltyPoints / parseFloat((settings?.loyaltyRedeemValue ?? 100).toString()),
  });
}
