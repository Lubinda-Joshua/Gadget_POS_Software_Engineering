import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { Search, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { DbError } from "@/components/ui/db-error";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Warranties" };

export default async function WarrantiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  noStore();
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";

  let warranties;
  try {
    warranties = await prisma.warranty.findMany({
      include: {
        saleItem: {
          include: {
            unit: true,
            sale: { include: { customer: true } },
          },
        },
      },
      orderBy: { startsAt: "desc" },
      take: 200,
    });
  } catch {
    return <DbError page="warranties" />;
  }

  const visible = query
    ? warranties.filter((warranty) => {
        const unit = warranty.saleItem.unit;
        const customer = warranty.saleItem.sale.customer;
        return [
          unit?.serialNumber,
          unit?.imei,
          warranty.saleItem.saleId,
          customer?.name,
          customer?.email,
          customer?.phone,
        ].some((value) => value?.toLowerCase().includes(query));
      })
    : warranties;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Warranty Register</h1>
        <p className="text-muted-foreground text-sm">
          Find coverage by serial number, IMEI, receipt, or customer.
        </p>
      </div>

      <form className="relative max-w-xl">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          name="q"
          defaultValue={(await searchParams).q ?? ""}
          placeholder="Search serial, IMEI, receipt, or customer…"
          className="bg-background h-11 w-full rounded-md border pr-3 pl-9 text-sm"
        />
      </form>

      {visible.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border border-dashed py-16">
          <ShieldCheck className="h-10 w-10 opacity-30" />
          <p className="text-sm">
            {query
              ? "No matching warranty found."
              : "Warranties appear after a serialized gadget is sold."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Serial / IMEI</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 font-medium">Coverage</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((warranty) => {
                const expired = warranty.expiresAt < new Date();
                const label =
                  warranty.status === "VOIDED" ? "Voided" : expired ? "Expired" : "Active";
                return (
                  <tr key={warranty.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{warranty.saleItem.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {warranty.saleItem.unit?.serialNumber ?? warranty.saleItem.unit?.imei}
                      {warranty.saleItem.unit?.serialNumber && warranty.saleItem.unit?.imei && (
                        <span className="text-muted-foreground block">
                          IMEI {warranty.saleItem.unit.imei}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {warranty.saleItem.sale.customer?.name ?? "Walk-in customer"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      #{warranty.saleItem.saleId.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {warranty.startsAt.toLocaleDateString()} –{" "}
                      {warranty.expiresAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          label === "Active" ? "text-emerald-600" : "text-muted-foreground"
                        }
                      >
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
