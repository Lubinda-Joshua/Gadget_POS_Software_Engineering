"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function updateSettings(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const taxRatePercent = parseFloat(raw.taxRate as string) || 0;

  const shared = {
    name: (raw.name as string) || "My Store",
    logoUrl: (raw.logoUrl as string) || null,
    primaryColor: (raw.primaryColor as string) || "#18181b",
    accentColor: (raw.accentColor as string) || "#6366f1",
    currency: "K",
    currencyDecimals: parseInt(raw.currencyDecimals as string, 10) || 2,
    taxRate: taxRatePercent / 100,
    taxName: (raw.taxName as string) || "Tax",
    receiptFooter: (raw.receiptFooter as string) || "",
    loyaltyEnabled: raw.loyaltyEnabled === "true",
    loyaltyEarnRate: parseFloat(raw.loyaltyEarnRate as string) || 1,
    loyaltyRedeemValue: parseFloat(raw.loyaltyRedeemValue as string) || 100,
    lowStockThreshold: parseInt(raw.lowStockThreshold as string, 10) || 5,
  };

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: shared,
    update: shared,
  });

  revalidatePath("/settings");
  revalidatePath("/pos");
}
