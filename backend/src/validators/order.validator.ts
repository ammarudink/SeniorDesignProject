import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../constants/roles";

export const orderIdParamsSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        ProductID: z.coerce.number().int().positive(),
        Quantity: z.coerce.number().int().positive(),
      }),
    )
    .optional(),
  useCart: z.boolean().optional().default(true),
  paymentMethod: z.enum([
    PAYMENT_METHODS.CASH,
    PAYMENT_METHODS.BANK_TRANSFER,
    PAYMENT_METHODS.CREDIT_CARD,
    PAYMENT_METHODS.STRIPE,
  ]),
  CardNumber: z.string().regex(/^\d{16}$/).optional(),
  ExpirationDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/).optional(),
  Cvc: z.string().regex(/^\d{3}$/).optional(),
})
  .superRefine((data, ctx) => {
    if (data.paymentMethod !== PAYMENT_METHODS.CREDIT_CARD) {
      return;
    }

    if (!data.CardNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CardNumber is required for credit-card payments",
        path: ["CardNumber"],
      });
    }

    if (!data.ExpirationDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ExpirationDate is required for credit-card payments",
        path: ["ExpirationDate"],
      });
    }

    if (!data.Cvc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cvc is required for credit-card payments",
        path: ["Cvc"],
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  Status: z.enum([
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.SHIPPED,
    ORDER_STATUSES.ACCEPTED,
    ORDER_STATUSES.CANCELLED,
  ]),
});
