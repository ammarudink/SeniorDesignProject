import { z } from "zod";
import { parseBoolean, parseStringList } from "../utils/query";

const salePriceSchema = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return Number(value);
  },
  z.number().positive().nullable().optional(),
);

export const productIdParamsSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "name-asc"]).optional(),
  categories: z.preprocess(parseStringList, z.array(z.string()).default([])),
  onSale: z.preprocess(parseBoolean, z.boolean().optional()),
});

export const dashboardQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export const relatedProductsQuerySchema = z.object({
  category: z.string().trim().min(1),
  exclude: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export const createProductSchema = z.object({
  Name: z.string().trim().min(2).max(255),
  Price: z.coerce.number().positive(),
  SalePrice: salePriceSchema,
  Category: z.string().trim().min(2).max(100),
  Images: z.string().trim().min(1).max(255),
  Description: z.string().trim().min(1).max(255),
  Stock: z.coerce.number().int().min(0),
});

export const updateProductSchema = z.object({
  Name: z.string().trim().min(2).max(255).optional(),
  Price: z.coerce.number().positive().optional(),
  SalePrice: salePriceSchema,
  Category: z.string().trim().min(2).max(100).optional(),
  Images: z.string().trim().min(1).max(255).optional(),
  Description: z.string().trim().min(1).max(255).optional(),
  Stock: z.coerce.number().int().min(0).optional(),
});
