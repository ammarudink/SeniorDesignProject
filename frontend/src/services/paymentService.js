import { apiRequest } from "./api";

export const paymentService = {
  async getProviders() {
    const response = await apiRequest("/payments/providers");
    return response.data || {};
  },

  async createPayment(payload) {
    const response = await apiRequest("/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    return response.data;
  },

  async createStripeCheckoutSession(payload = {}) {
    const response = await apiRequest("/payments/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    return response.data;
  },

  async completeStripeCheckout(sessionId) {
    const response = await apiRequest(`/payments/stripe/success?session_id=${encodeURIComponent(sessionId)}`);
    return response.data;
  },
};
