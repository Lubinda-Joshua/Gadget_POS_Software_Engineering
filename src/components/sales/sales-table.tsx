"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/translations";
import { RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RefundModal } from "./refund-modal";

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: { toString(): string };
  total: { toString(): string };
  notes?: string | null;
  productId?: string | null;
  unit?: { serialNumber: string | null; imei: string | null } | null;
  warranty?: { expiresAt: Date; status: string } | null;
}

interface Sale {
  id: string;
  createdAt: Date;
  total: { toString(): string };
  paymentMethod: string;
  status: string;
  items: SaleItem[];
  user: { name: string } | null;
}

interface SalesTableProps {
  sales: Sale[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const t = useTranslations("sales");
  const tr = useTranslations("receipt");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<Sale | null>(null);

  const saleDateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  if (sales.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-sm">
        {t("no_sales")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border text-sm">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t("date")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("cashier")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("payment")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("total")}</th>
              <th className="px-4 py-3 text-center font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.flatMap((sale, idx) => {
              const saleTimestamp = new Date(sale.createdAt).getTime();
              const saleKey = `${sale.id ?? "no-id"}-${saleTimestamp}-${idx}`;

              const mainRow = (
                <tr
                  key={`${saleKey}-main`}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                >
                  <td className="px-4 py-3">
                    {saleDateFormatter.format(new Date(sale.createdAt))}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{sale.user?.name ?? "—"}</td>
                  <td className="px-4 py-3">{sale.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={sale.status === "VOIDED" ? "text-destructive" : "text-green-600"}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(parseFloat(sale.total.toString()))}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      {sale.status === "COMPLETED" && (
                        <button
                          onClick={() => setRefunding(sale)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                          title="Issue Refund"
                        >
                          <RotateCcw className="h-3 w-3" /> {t("refund")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );

              if (expanded !== sale.id) {
                return [mainRow];
              }

              const detailRow = (
                <tr className="bg-muted/20" key={`${saleKey}-details`}>
                  <td colSpan={6} className="px-6 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="py-1 text-left">{tr("items")}</th>
                          <th className="py-1 text-right">{tr("qty")}</th>
                          <th className="py-1 text-right">{tr("price")}</th>
                          <th className="py-1 text-right">{t("total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.items.map((item, i) => {
                          const itemKey = `${item.id ?? "no-item-id"}-${saleKey}-${i}`;
                          return (
                            <>
                              <tr key={itemKey}>
                                <td className="py-1">{item.name}</td>
                                <td className="py-1 text-right">{item.quantity}</td>
                                <td className="py-1 text-right">
                                  {formatCurrency(parseFloat(item.price.toString()))}
                                </td>
                                <td className="py-1 text-right">
                                  {formatCurrency(parseFloat(item.total.toString()))}
                                </td>
                              </tr>
                              {item.notes && (
                                <tr key={`${itemKey}-notes`}>
                                  <td
                                    colSpan={4}
                                    className="text-muted-foreground pb-1 pl-3 text-[10px] italic"
                                  >
                                    {item.notes}
                                  </td>
                                </tr>
                              )}
                              {item.unit && (
                                <tr key={`${itemKey}-serial`}>
                                  <td
                                    colSpan={4}
                                    className="pb-1 pl-3 font-mono text-[10px] text-blue-600 dark:text-blue-400"
                                  >
                                    {item.unit.serialNumber && `S/N ${item.unit.serialNumber}`}
                                    {item.unit.serialNumber && item.unit.imei && " · "}
                                    {item.unit.imei && `IMEI ${item.unit.imei}`}
                                    {item.warranty &&
                                      ` · Warranty to ${new Date(item.warranty.expiresAt).toLocaleDateString()}`}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </td>
                </tr>
              );

              return [mainRow, detailRow];
            })}
          </tbody>
        </table>
      </div>

      {refunding && (
        <RefundModal
          saleId={refunding.id}
          saleTotal={parseFloat(refunding.total.toString())}
          items={refunding.items}
          onClose={() => setRefunding(null)}
        />
      )}
    </>
  );
}
