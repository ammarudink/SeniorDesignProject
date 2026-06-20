import { z } from "zod";
import { PAYMENT_METHODS } from "../constants/roles";

export const createPaymentSchema = z
  .object({
    OrderID: z.coerce.number().int().positive(),
    PaymentMethod: z.enum([
      PAYMENT_METHODS.CASH,
      PAYMENT_METHODS.BANK_TRANSFER,
      PAYMENT_METHODS.CREDIT_CARD,
    ]),
    CardNumber: z.string().regex(/^\d{16}$/).optional(),
    ExpirationDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/).optional(),
    Cvc: z.string().regex(/^\d{3}$/).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.PaymentMethod !== PAYMENT_METHODS.CREDIT_CARD) {
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

export const createStripeCheckoutSessionSchema = z.object({
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
