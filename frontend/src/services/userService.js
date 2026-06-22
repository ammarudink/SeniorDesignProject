import { apiRequest } from "./api";

export const userService = {
  updateUser(userId, payload) {
    return apiRequest(`/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
  },

  deleteUser(userId) {
    return apiRequest(`/users/${userId}`, { method: "DELETE" });
  },
};
