"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/translations";
import Link from "next/link";
import { Pencil, Trash2, AlertTriangle, PackagePlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteProduct } from "@/app/actions/product-actions";
import { StockAdjustModal } from "./stock-adjust-modal";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: { toString(): string };
  stock: number;
  lowStockThreshold: number;
  category: string | null;
  active: boolean;
  trackingMode: "QUANTITY" | "SERIALIZED";
}

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const t = useTranslations("products");
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  if (products.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-sm">
        {t("no_products")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t("name")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("sku")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("category")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("price")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("stock")}</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => {
              const isLowStock = product.stock <= product.lowStockThreshold;
              return (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-primary hover:underline"
                      >
                        {product.name}
                      </Link>
                      {!product.active && (
                        <span className="text-muted-foreground text-xs">(inactive)</span>
                      )}
                      {product.trackingMode === "SERIALIZED" && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Serial / IMEI
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{product.sku ?? "—"}</td>
                  <td className="text-muted-foreground px-4 py-3">{product.category ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(parseFloat(product.price.toString()))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        isLowStock
                          ? "flex items-center justify-end gap-1 font-medium text-yellow-600"
                          : ""
                      }
                    >
                      {isLowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                      {product.stock}
                      {isLowStock && <span className="text-xs">(low stock)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {product.trackingMode === "QUANTITY" && (
                        <button
                          onClick={() => setAdjusting(product)}
                          className="hover:bg-accent rounded p-1.5 transition-colors"
                          title="Adjust Stock"
                        >
                          <PackagePlus className="text-muted-foreground h-4 w-4" />
                        </button>
                      )}
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="hover:bg-accent rounded p-1.5 transition-colors"
                      >
                        <Pencil className="text-muted-foreground h-4 w-4" />
                      </Link>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <button
                          type="submit"
                          className="hover:bg-destructive/10 hover:text-destructive rounded p-1.5 transition-colors"
                        >
                          <Trash2 className="text-muted-foreground h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjusting && (
        <StockAdjustModal
          productId={adjusting.id}
          productName={adjusting.name}
          currentStock={adjusting.stock}
          onClose={() => setAdjusting(null)}
        />
      )}
    </>
  );
}
