import { apiRequest } from "./api";

export const orderService = {
  async getOrders() {
    const response = await apiRequest("/orders");
    return response.data || [];
  },

  async createOrder(payload = { useCart: true }) {
    const response = await apiRequest("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    return response.data;
  },

  async updateOrderStatus(orderId, status) {
    const response = await apiRequest(`/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: { Status: status },
    });
    return response.data;
  },
};
