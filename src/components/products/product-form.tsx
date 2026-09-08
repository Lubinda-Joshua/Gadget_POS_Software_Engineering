"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/app/actions/product-actions";
import { cn } from "@/lib/utils";
import { Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: { toString(): string };
  cost: { toString(): string } | null;
  stock: number;
  category: string | null;
  imageUrl: string | null;
  lowStockThreshold: number;
  trackingMode: "QUANTITY" | "SERIALIZED";
  warrantyMonths: number;
  active: boolean;
}

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product;
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl ?? null);

  const {
    register: registerField,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProductFormValues, any, any>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku ?? "",
          barcode: product.barcode ?? "",
          price: parseFloat(product.price.toString()),
          cost: product.cost ? parseFloat(product.cost.toString()) : undefined,
          stock: product.stock,
          category: product.category ?? "",
          lowStockThreshold: product.lowStockThreshold,
          trackingMode: product.trackingMode,
          warrantyMonths: product.warrantyMonths,
          imageUrl: product.imageUrl ?? "",
          active: product.active,
        }
      : {
          stock: 0,
          lowStockThreshold: 5,
          trackingMode: "QUANTITY",
          warrantyMonths: 0,
          active: true,
        },
  });

  const trackingMode = watch("trackingMode");

  async function onSubmit(values: ProductFormValues) {
    const formData = new FormData();
    Object.entries(values as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res: { error?: any } | undefined;

    if (isEdit) {
      res = await updateProduct(product!.id, formData);
    } else {
      res = await createProduct(formData);
    }

    if (res?.error) {
      const fieldErrors = res.error.fieldErrors || {};
      const formErrors: string[] = res.error.formErrors || [];

      // Set field-level errors (shows red border + message under the field)
      Object.keys(fieldErrors).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError(key as any, { type: "server", message: fieldErrors[key][0] });
        toast.error(fieldErrors[key][0]); // also pop a toast for visibility
      });

      // Form-level errors (not tied to a specific field)
      if (Object.keys(fieldErrors).length === 0) {
        toast.error(formErrors[0] ?? "Failed to save product. Please try again.");
      }
      return;
    }

    toast.success(isEdit ? "Product updated successfully" : "Product created successfully");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setValue("imageUrl", url);
        setPreviewUrl(url);
      }
    } finally {
      setUploadLoading(false);
    }
  }

  function field(
    label: string,
    name: keyof ProductFormValues,
    props?: React.InputHTMLAttributes<HTMLInputElement>
  ) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
        <input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...registerField(name as any)}
          {...props}
          className={cn(
            "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            errors[name] && "border-destructive"
          )}
        />
        {errors[name] && (
          <p className="text-destructive text-xs">{String(errors[name]?.message)}</p>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      {field("Name *", "name", { placeholder: "e.g. Samsung Galaxy A55 128 GB" })}

      <div className="grid grid-cols-2 gap-4">
        {field("SKU", "sku", { placeholder: "PHONE-A55-128" })}
        {field("Barcode", "barcode", { placeholder: "4006381333931" })}
      </div>

      <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
        <div className="space-y-1.5">
          <label htmlFor="trackingMode" className="text-sm font-medium">
            Inventory Tracking *
          </label>
          <select
            id="trackingMode"
            {...registerField("trackingMode")}
            disabled={isEdit}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="QUANTITY">Quantity — interchangeable accessories</option>
            <option value="SERIALIZED">Serial / IMEI — phones, laptops and tablets</option>
          </select>
          {isEdit && <input type="hidden" {...registerField("trackingMode")} />}
          <p className="text-muted-foreground text-xs">
            {isEdit
              ? "Tracking mode is fixed after creation to protect inventory history."
              : "Serialized products are stocked by registering each physical unit after saving."}
          </p>
        </div>

        {field("Warranty (months)", "warrantyMonths", {
          type: "number",
          min: "0",
          max: "60",
          step: "1",
          placeholder: "12",
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field("Price *", "price", { type: "number", step: "0.01", min: "0", placeholder: "0.00" })}
        {field("Cost", "cost", { type: "number", step: "0.01", min: "0", placeholder: "0.00" })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {trackingMode === "SERIALIZED" ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Stock</label>
            <input type="hidden" {...registerField("stock")} />
            <div className="bg-muted text-muted-foreground flex h-10 items-center rounded-md border px-3 text-sm">
              {product?.stock ?? 0} registered unit(s)
            </div>
          </div>
        ) : (
          field("Stock", "stock", { type: "number", min: "0", step: "1" })
        )}
        {field("Low Stock Alert", "lowStockThreshold", { type: "number", min: "0", step: "1" })}
      </div>

      {field("Category", "category", { placeholder: "Smartphones" })}

      {/* Image upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Product Image</label>
        <div className="flex items-center gap-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Product preview"
              className="h-16 w-16 rounded-md border object-cover"
            />
          ) : (
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-md border">
              <ImageIcon className="text-muted-foreground h-6 w-6" />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <label
              htmlFor="image-upload"
              className={cn(
                "hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                uploadLoading && "pointer-events-none opacity-50"
              )}
            >
              <Upload className="h-4 w-4" />
              {uploadLoading ? "Uploading…" : "Upload image"}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageUpload}
              />
            </label>
            <p className="text-muted-foreground text-xs">JPEG, PNG, WebP up to 5 MB</p>
          </div>
        </div>
        {/* Hidden field for imageUrl */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <input type="hidden" {...registerField("imageUrl" as any)} />
      </div>

      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <input
          type="checkbox"
          id="active"
          {...registerField("active" as any)}
          className="h-4 w-4"
        />
        <label htmlFor="active" className="text-sm font-medium">
          Active (visible in POS)
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : isEdit ? "Update Product" : "Add Product"}
        </button>
      </div>
    </form>
  );
}
