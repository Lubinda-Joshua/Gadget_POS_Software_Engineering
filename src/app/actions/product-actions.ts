"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { productFormSchema } from "@/lib/validations/product";

/** Check if a P2002 error relates to a given field name */
function isConstraintOn(e: any, field: string): boolean {
  // Prisma 7 with adapter uses meta.constraint (the raw PG constraint name)
  // Older versions use meta.target (array of field names)
  const constraint: string = e.meta?.constraint ?? "";
  const target: unknown = e.meta?.target;
  const fieldLower = field.toLowerCase();

  if (constraint && constraint.toLowerCase().includes(fieldLower)) return true;
  if (Array.isArray(target))
    return target.some((t: string) => t.toLowerCase().includes(fieldLower));
  if (typeof target === "string") return target.toLowerCase().includes(fieldLower);
  return false;
}

export async function createProduct(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const data = {
    ...parsed.data,
    stock: parsed.data.trackingMode === "SERIALIZED" ? 0 : parsed.data.stock,
    sku: parsed.data.sku || null,
    barcode: parsed.data.barcode || null,
    category: parsed.data.category || null,
    imageUrl: parsed.data.imageUrl || null,
  };

  try {
    await prisma.product.create({ data });
  } catch (e: any) {
    console.error("createProduct error:", e.code, JSON.stringify(e.meta));
    if (e.code === "P2002") {
      if (isConstraintOn(e, "sku")) {
        return {
          error: {
            formErrors: [],
            fieldErrors: { sku: ["A product with this SKU already exists"] },
          },
        };
      }
      if (isConstraintOn(e, "barcode")) {
        return {
          error: {
            formErrors: [],
            fieldErrors: { barcode: ["A product with this Barcode already exists"] },
          },
        };
      }
      return {
        error: {
          formErrors: ["A duplicate value was found. Please check SKU or barcode."],
          fieldErrors: {},
        },
      };
    }
    return {
      error: { formErrors: ["An unexpected error occurred. Please try again."], fieldErrors: {} },
    };
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const data = {
    ...parsed.data,
    sku: parsed.data.sku || null,
    barcode: parsed.data.barcode || null,
    category: parsed.data.category || null,
    imageUrl: parsed.data.imageUrl || null,
  };

  if (data.trackingMode === "SERIALIZED") {
    delete (data as Partial<typeof data>).stock;
  }

  try {
    await prisma.product.update({ where: { id }, data });
  } catch (e: any) {
    console.error("updateProduct error:", e.code, JSON.stringify(e.meta));
    if (e.code === "P2002") {
      if (isConstraintOn(e, "sku")) {
        return {
          error: {
            formErrors: [],
            fieldErrors: { sku: ["A product with this SKU already exists"] },
          },
        };
      }
      if (isConstraintOn(e, "barcode")) {
        return {
          error: {
            formErrors: [],
            fieldErrors: { barcode: ["A product with this Barcode already exists"] },
          },
        };
      }
      return {
        error: {
          formErrors: ["A duplicate value was found. Please check SKU or barcode."],
          fieldErrors: {},
        },
      };
    }
    return {
      error: { formErrors: ["An unexpected error occurred. Please try again."], fieldErrors: {} },
    };
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
}
