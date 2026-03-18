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
  paymentMethod: z
    .enum([
      PAYMENT_METHODS.CASH,
      PAYMENT_METHODS.BANK_TRANSFER,
      PAYMENT_METHODS.CREDIT_CARD,
    ])
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  Status: z.enum([
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.SHIPPED,
    ORDER_STATUSES.DELIVERED,
    ORDER_STATUSES.CANCELLED,
  ]),
});
