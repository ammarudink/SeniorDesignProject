import { apiRequest } from "./api";

export const wishlistService = {
  async getWishlist() {
    const response = await apiRequest("/wishlist");
    return response.data || [];
  },

  async addItem(productId) {
    const response = await apiRequest("/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { productId },
    });
    return response.data;
  },

  removeItem(productId) {
    return apiRequest(`/wishlist/${productId}`, { method: "DELETE" });
  },
};
