import { z } from "zod";
import { ROLES } from "../constants/roles";

export const userIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const updateUserSchema = z.object({
  Name: z.string().trim().min(2).optional(),
  Address: z.string().trim().min(5).optional(),
  Role: z.enum([ROLES.ADMIN, ROLES.CUSTOMER]).optional(),
  Password: z.string().min(6).optional(),
});
