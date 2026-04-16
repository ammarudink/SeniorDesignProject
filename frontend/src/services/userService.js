import { apiRequest } from "./api";

export const userService = {
  deleteUser(userId) {
    return apiRequest(`/users/${userId}`, { method: "DELETE" });
  },
};
