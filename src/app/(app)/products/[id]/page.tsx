import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { formatCurrency } from "@/lib/utils";
import { Edit, Package, TrendingUp, TrendingDown } from "lucide-react";
import { StockAdjustButton } from "@/components/products/stock-adjust-button";
import { DbError } from "@/components/ui/db-error";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SerializedUnitsPanel } from "@/components/products/serialized-units-panel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product
    .findUnique({ where: { id }, select: { name: true } })
    .catch(() => null);
  return { title: product ? `${product.name} — Inventory` : "Product" };
}

export default async function ProductDetailPage({ params }: Props) {
  noStore();
  const { id } = await params;

  let product;
  let adjustments;
  try {
    const rawProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        units: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!rawProduct) notFound();
    product = serialize(rawProduct);

    const rawAdj = await prisma.stockAdjustment.findMany({
      where: { productId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    adjustments = serialize(rawAdj);
  } catch (e: any) {
    if (e?.name === "NotFoundError") notFound();
    return <DbError page="product" />;
  }

  const reasonLabel: Record<string, string> = {
    RECEIVED: "Received",
    DAMAGED: "Damaged",
    THEFT: "Theft",
    CORRECTION: "Correction",
    OPENING_COUNT: "Opening Count",
  };

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: product.name }]} />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {product.trackingMode === "QUANTITY" && (
          <StockAdjustButton
            productId={product.id}
            productName={product.name}
            currentStock={product.stock}
          />
        )}
        <Link
          href={`/products/${id}/edit`}
          className="border-border bg-background text-foreground hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <Edit className="h-3.5 w-3.5" /> Edit
        </Link>
      </div>

      {/* Product summary */}
      <div className="bg-card space-y-4 rounded-lg border p-6">
        <div className="flex items-start gap-4">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border">
              <Package className="text-muted-foreground h-8 w-8" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold">{product.name}</h1>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {product.sku && (
                <span>
                  SKU: <span className="font-mono">{product.sku}</span>
                </span>
              )}
              {product.barcode && (
                <span>
                  Barcode: <span className="font-mono">{product.barcode}</span>
                </span>
              )}
              {product.category && <span>Category: {product.category}</span>}
              {product.supplier && <span>Supplier: {product.supplier.name}</span>}
              <span>
                {product.trackingMode === "SERIALIZED"
                  ? "Serial / IMEI tracked"
                  : "Quantity tracked"}
              </span>
              {product.warrantyMonths > 0 && <span>Warranty: {product.warrantyMonths} months</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-2 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase">Current Stock</p>
            <p
              className={`text-2xl font-bold ${product.stock <= product.lowStockThreshold ? "text-amber-600 dark:text-amber-400" : ""}`}
            >
              {product.stock}
              {product.stock <= product.lowStockThreshold && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Low
                </span>
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase">Sale Price</p>
            <p className="text-2xl font-bold">
              {formatCurrency(parseFloat(String(product.price)))}
            </p>
          </div>
          {product.cost && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase">Cost</p>
              <p className="text-2xl font-bold">
                {formatCurrency(parseFloat(String(product.cost)))}
              </p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase">Low Stock At</p>
            <p className="text-2xl font-bold">{product.lowStockThreshold}</p>
          </div>
        </div>
      </div>

      {product.trackingMode === "SERIALIZED" && (
        <SerializedUnitsPanel productId={product.id} units={product.units} />
      )}

      {/* Inventory Log */}
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Inventory Adjustment Log</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            All stock movements for this product
          </p>
        </div>

        {adjustments.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm">No stock adjustments yet</p>
            <p className="text-xs">
              Use the &quot;Adjust Stock&quot; button to record stock movements
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr className="text-muted-foreground text-xs font-medium uppercase">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3 text-left">Note</th>
                <th className="px-4 py-3 text-left">By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {adjustments.map((adj: any) => (
                <tr key={adj.id} className="hover:bg-muted/30 transition-colors">
                  <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                    {formatter.format(new Date(adj.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium">
                      {reasonLabel[adj.reason] ?? adj.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-semibold ${
                        adj.delta > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                      }`}
                    >
                      {adj.delta > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
                    </span>
                  </td>
                  <td className="text-muted-foreground max-w-[200px] truncate px-4 py-3 text-xs">
                    {adj.note ?? <span className="opacity-40">—</span>}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {adj.user?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
