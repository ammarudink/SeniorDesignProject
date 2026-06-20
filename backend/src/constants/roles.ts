export const ROLES = {
  ADMIN: "Admin",
  CUSTOMER: "Customer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ORDER_STATUSES = {
  PENDING: "Pending",
  SHIPPED: "Shipped",
  ACCEPTED: "Accepted",
  CANCELLED: "Cancelled",
} as const;

export const PAYMENT_STATUSES = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
} as const;

export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit-card",
  CASH: "cash",
  BANK_TRANSFER: "bank-transfer",
  STRIPE: "stripe",
} as const;
