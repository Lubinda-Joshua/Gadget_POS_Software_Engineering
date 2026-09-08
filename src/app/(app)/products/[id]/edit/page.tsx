import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { ProductForm } from "@/components/products/product-form";
import { DbError } from "@/components/ui/db-error";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit Product" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  noStore();
  const { id } = await params;

  let product;
  try {
    const raw = await prisma.product.findUnique({ where: { id } });
    if (!raw) notFound();
    product = serialize(raw);
  } catch (e: any) {
    if (e?.name === "NotFoundError") notFound();
    return <DbError page="this product" />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <Breadcrumb items={[
        { label: "Products", href: "/products" },
        { label: product.name, href: `/products/${id}` },
        { label: "Edit" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
