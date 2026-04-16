import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const wishlistIdParamsSchema = z.object({
  productId: positiveInt,
});

export const addWishlistItemSchema = z
  .object({
    ProductID: positiveInt.optional(),
    productId: positiveInt.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.ProductID && !data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "productId is required",
        path: ["productId"],
      });
    }
  })
  .transform((data) => ({
    ProductID: data.ProductID ?? data.productId,
  }));
