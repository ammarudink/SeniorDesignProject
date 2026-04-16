import { apiRequest } from "./api";

function toQueryString(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      search.set(key, JSON.stringify(value));
      return;
    }

    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const productService = {
  async getProducts(params) {
    const response = await apiRequest(`/products${toQueryString(params)}`);
    return response.data;
  },

  async getDashboardProducts(limit = 8) {
    const response = await apiRequest(`/products/dashboard${toQueryString({ limit })}`);
    return response.data || [];
  },

  async getCategories() {
    const response = await apiRequest("/products/categories");
    return response.data || [];
  },

  async getProductById(productId) {
    const response = await apiRequest(`/products/${productId}`);
    return response.data;
  },

  async getRelatedProducts(category, exclude, limit = 4) {
    const response = await apiRequest(
      `/products/related${toQueryString({ category, exclude, limit })}`,
    );
    return response.data || [];
  },

  async updateProduct(productId, payload) {
    const response = await apiRequest(`/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    return response.data;
  },
};
