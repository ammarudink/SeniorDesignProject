import Stripe from "stripe";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

export class StripeService {
  private getClient() {
    if (!env.STRIPE_SECRET_KEY) {
      throw new ApiError(500, "Stripe is not configured");
    }

    return new Stripe(env.STRIPE_SECRET_KEY);
  }

  async createCheckoutSession(input: {
    orderId: number;
    totalAmount: number;
    successUrl?: string;
    cancelUrl?: string;
  }) {
    const frontendUrl = env.FRONTEND_URL.replace(/\/$/, "");

    return this.getClient().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: env.STRIPE_CURRENCY,
            unit_amount: Math.round(input.totalAmount * 100),
            product_data: {
              name: `Order #${input.orderId}`,
            },
          },
        },
      ],
      metadata: {
        orderId: String(input.orderId),
      },
      success_url:
        input.successUrl ||
        `${frontendUrl}/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl || `${frontendUrl}/checkout?payment=cancelled`,
    });
  }

  async retrieveCheckoutSession(sessionId: string) {
    return this.getClient().checkout.sessions.retrieve(sessionId);
  }
}
