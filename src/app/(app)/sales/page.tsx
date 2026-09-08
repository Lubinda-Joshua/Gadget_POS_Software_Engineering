import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getTranslations } from "@/lib/translations";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { SalesTable } from "@/components/sales/sales-table";
import { SalesExportButton } from "@/components/sales/sales-export-button";
import { DbError } from "@/components/ui/db-error";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales" };

export default async function SalesPage() {
  noStore();
  const t = await getTranslations("sales");

  let sales;
  try {
    const raw = await prisma.sale.findMany({
      include: {
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
            total: true,
            notes: true,
            productId: true,
            unit: { select: { serialNumber: true, imei: true } },
            warranty: { select: { expiresAt: true, status: true } },
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    sales = serialize(raw);
  } catch {
    return <DbError page="sales" />;
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <SalesExportButton />
      </div>
      <SalesTable sales={sales} />
    </div>
  );
}
