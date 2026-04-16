import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const cartIdParamsSchema = z.object({
  cartId: positiveInt,
});

export const addCartItemSchema = z
  .object({
    ProductID: positiveInt.optional(),
    productId: positiveInt.optional(),
    Quantity: positiveInt.optional(),
    quantity: positiveInt.optional(),
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
    Quantity: data.Quantity ?? data.quantity ?? 1,
  }));

export const updateCartItemSchema = z
  .object({
    Quantity: positiveInt.optional(),
    quantity: positiveInt.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.Quantity && !data.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "quantity is required",
        path: ["quantity"],
      });
    }
  })
  .transform((data) => ({
    Quantity: data.Quantity ?? data.quantity,
  }));
