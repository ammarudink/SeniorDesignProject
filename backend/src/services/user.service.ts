import bcrypt from "bcrypt";
import { ROLES, Role } from "../constants/roles";
import { UserRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/api-error";

const sanitizeUser = (user: {
  UserID: number;
  Name: string;
  Email: string;
  Address: string;
  Role: string;
}) => ({
  UserID: user.UserID,
  Name: user.Name,
  Email: user.Email,
  Address: user.Address,
  Role: user.Role,
});

export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async getUsers() {
    const users = await this.userRepository.findMany();
    return users.map((user) => sanitizeUser(user));
  }

  async getUserById(userId: number) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return sanitizeUser(user);
  }

  async updateUser(
    targetUserId: number,
    actor: { userId: number; role: string },
    payload: {
      Name?: string;
      Address?: string;
      Role?: Role;
      Password?: string;
    },
  ) {
    if (actor.role !== ROLES.ADMIN && actor.userId !== targetUserId) {
      throw new ApiError(403, "You can only update your own profile");
    }

    if (payload.Role && actor.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Only admins can change user roles");
    }

    const existingUser = await this.userRepository.findById(targetUserId);

    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    const password = payload.Password ? await bcrypt.hash(payload.Password, 10) : undefined;
    const updatedUser = await this.userRepository.update(targetUserId, {
      Name: payload.Name,
      Address: payload.Address,
      Role: payload.Role,
      Password: password,
    });

    return sanitizeUser(updatedUser);
  }

  async deleteUser(targetUserId: number, actor: { userId: number; role: string }) {
    if (actor.role !== ROLES.ADMIN && actor.userId !== targetUserId) {
      throw new ApiError(403, "You can only delete your own account");
    }

    const existingUser = await this.userRepository.findById(targetUserId);

    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    await this.userRepository.delete(targetUserId);
  }
}
