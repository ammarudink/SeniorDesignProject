import { apiRequest } from "./api";

export const paymentService = {
  async createPayment(payload) {
    const response = await apiRequest("/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    return response.data;
  },
};
