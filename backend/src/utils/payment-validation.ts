import { PAYMENT_METHODS } from "../constants/roles";

type CreditCardPayload = {
  PaymentMethod: string;
  CardNumber?: string;
  ExpirationDate?: string;
  Cvc?: string;
};

export const isCardExpired = (expirationDate: string) => {
  const [month, year] = expirationDate.split("/");
  const expiration = new Date(Number(`20${year}`), Number(month), 0, 23, 59, 59);
  return expiration.getTime() < Date.now();
};

export const validatePaymentPayload = (payload: CreditCardPayload) => {
  if (payload.PaymentMethod !== PAYMENT_METHODS.CREDIT_CARD) {
    return;
  }

  if (!payload.CardNumber || !/^\d{16}$/.test(payload.CardNumber)) {
    throw new Error("Card number must contain 16 digits");
  }

  if (!payload.ExpirationDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(payload.ExpirationDate)) {
    throw new Error("Expiration date must be in MM/YY format");
  }

  if (isCardExpired(payload.ExpirationDate)) {
    throw new Error("Card expiration date is invalid or expired");
  }

  if (!payload.Cvc || !/^\d{3}$/.test(payload.Cvc)) {
    throw new Error("CVC must contain 3 digits");
  }
};
