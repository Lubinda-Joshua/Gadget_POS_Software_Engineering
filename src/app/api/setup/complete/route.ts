import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  businessName: z.string().min(1, "Business name is required").max(100),
  currency: z.literal("K").default("K"),
  currencyDecimals: z.coerce.number().int().min(0).max(4).default(2),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxName: z.string().max(30).default("Tax"),
  receiptFooter: z.string().max(200).default("Thank you for your purchase!"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Guard: only allow if setup not yet complete
  try {
    const { prisma } = await import("@/lib/db");
    const existing = await prisma.businessSettings.findUnique({
      where: { id: "singleton" },
      select: { setupComplete: true },
    });
    if (existing?.setupComplete) {
      return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
    }
  } catch {
    // DB not ready
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { businessName, currency, currencyDecimals, taxRate, taxName, receiptFooter } = parsed.data;

  try {
    const { prisma } = await import("@/lib/db");

    await prisma.businessSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        name: businessName,
        currency,
        currencyDecimals,
        taxRate: taxRate / 100,
        taxName,
        receiptFooter,
        setupComplete: true,
      },
      update: {
        name: businessName,
        currency,
        currencyDecimals,
        taxRate: taxRate / 100,
        taxName,
        receiptFooter,
        setupComplete: true,
      },
    });

    const response = NextResponse.json({ ok: true });
    // Set a cookie so middleware knows setup is complete without a DB round-trip
    response.cookies.set("gadget-pos-setup-complete", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
