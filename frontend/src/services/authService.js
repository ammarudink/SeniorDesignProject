import { apiRequest } from "./api";

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
};
