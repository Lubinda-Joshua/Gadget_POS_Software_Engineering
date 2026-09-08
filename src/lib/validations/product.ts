import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().max(100).optional().or(z.literal("")),
  barcode: z.string().max(100).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  category: z.string().max(100).optional().or(z.literal("")),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  trackingMode: z.enum(["QUANTITY", "SERIALIZED"]).default("QUANTITY"),
  warrantyMonths: z.coerce.number().int().min(0).max(60).default(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  active: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true" || val === "on";
      return val === true;
    }, z.boolean())
    .default(true),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
