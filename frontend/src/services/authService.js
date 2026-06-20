import { apiRequest } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const authService = {
  login(credentials) {
    return apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: credentials,
    });
  },

  register(payload) {
    return apiRequest("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
  },

  getProfile() {
    return apiRequest("/auth/me");
  },

  getProviders() {
    return apiRequest("/auth/providers");
  },

  getGoogleLoginUrl() {
    return `${API_BASE_URL}/auth/google`;
  },
};
