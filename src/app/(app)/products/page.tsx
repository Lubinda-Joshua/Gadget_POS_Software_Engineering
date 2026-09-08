import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { ProductTable } from "@/components/products/product-table";
import { DbError } from "@/components/ui/db-error";
import { getTranslations } from "@/lib/translations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  noStore();
  const t = await getTranslations("products");

  let products;
  try {
    const raw = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    products = serialize(raw);
  } catch {
    return <DbError page="products" />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href="/products/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
        >
          + {t("add")}
        </Link>
      </div>
      <ProductTable products={products} />
    </div>
  );
}
