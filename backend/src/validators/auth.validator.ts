import { z } from "zod";
import { ROLES } from "../constants/roles";

export const registerSchema = z
  .object({
    Name: z.string().trim().min(2),
    Email: z.string().trim().email().transform((value) => value.toLowerCase()),
    Password: z.string().min(6),
    ConfirmPassword: z.string().min(6).optional(),
    Address: z.string().trim().min(5),
    Role: z.enum([ROLES.ADMIN, ROLES.CUSTOMER]).default(ROLES.CUSTOMER),
    AdminPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.Role === ROLES.ADMIN && !data.AdminPassword?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AdminPassword is required when Role is Admin",
        path: ["AdminPassword"],
      });
    }
  })
  .refine(
    (data) => !data.ConfirmPassword || data.Password === data.ConfirmPassword,
    {
      message: "Password confirmation does not match",
      path: ["ConfirmPassword"],
    },
  );

export const loginSchema = z.object({
  Email: z.string().trim().email().transform((value) => value.toLowerCase()),
  Password: z.string().min(6),
});
