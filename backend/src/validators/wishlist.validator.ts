import { z } from "zod";

export const wishlistIdParamsSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const addWishlistItemSchema = z.object({
  ProductID: z.coerce.number().int().positive(),
});
