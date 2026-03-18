import { z } from "zod";

export const cartIdParamsSchema = z.object({
  cartId: z.coerce.number().int().positive(),
});

export const addCartItemSchema = z.object({
  ProductID: z.coerce.number().int().positive(),
  Quantity: z.coerce.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  Quantity: z.coerce.number().int().positive(),
});
