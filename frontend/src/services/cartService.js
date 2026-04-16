import { apiRequest } from "./api";

export const cartService = {
  async getCart() {
    const response = await apiRequest("/cart");
    return response.data || [];
  },

  async addItem(productId, quantity = 1) {
    const response = await apiRequest("/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { productId, quantity },
    });
    return response.data;
  },

  async updateItem(cartId, quantity) {
    const response = await apiRequest(`/cart/${cartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: { quantity },
    });
    return response.data;
  },

  removeItem(cartId) {
    return apiRequest(`/cart/${cartId}`, { method: "DELETE" });
  },

  clearCart() {
    return apiRequest("/cart", { method: "DELETE" });
  },
};
