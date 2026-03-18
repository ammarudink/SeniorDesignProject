import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { env } from "../config/env";
import { ROLES, Role } from "../constants/roles";
import { UserRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/api-error";

type RegisterInput = {
  Name: string;
  Email: string;
  Password: string;
  Address: string;
  Role?: Role;
  AdminPassword?: string;
};

type LoginInput = {
  Email: string;
  Password: string;
};

const sanitizeUser = (user: User) => ({
  UserID: user.UserID,
  Name: user.Name,
  Email: user.Email,
  Address: user.Address,
  Role: user.Role,
});

const isBcryptHash = (value: string) => /^\$2[aby]\$\d{2}\$/.test(value);
const isLegacyPhpBcryptHash = (value: string) => /^\$2y\$\d{2}\$/.test(value);

export class AuthService {
  constructor(private readonly userRepository = new UserRepository()) {}

  private signToken(user: User) {
    return jwt.sign(
      {
        sub: user.UserID,
        email: user.Email,
        role: user.Role,
        name: user.Name,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      },
    );
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(password: string, storedPassword: string) {
    if (isLegacyPhpBcryptHash(storedPassword)) {
      const normalizedHash = storedPassword.replace(/^\$2y\$/, "$2b$");
      const isMatch = await bcrypt.compare(password, normalizedHash);

      return {
        isMatch,
        shouldUpgradeHash: isMatch,
      };
    }

    if (isBcryptHash(storedPassword)) {
      return {
        isMatch: await bcrypt.compare(password, storedPassword),
        shouldUpgradeHash: false,
      };
    }

    return {
      isMatch: password === storedPassword,
      shouldUpgradeHash: password === storedPassword,
    };
  }

  async register(payload: RegisterInput) {
    const existingUser = await this.userRepository.findByEmail(payload.Email);

    if (existingUser) {
      throw new ApiError(409, "Email is already registered");
    }

    if (payload.Role === ROLES.ADMIN && payload.AdminPassword !== env.ADMIN_REGISTRATION_SECRET) {
      throw new ApiError(403, "Invalid admin registration secret");
    }

    const hashedPassword = await this.hashPassword(payload.Password);
    const user = await this.userRepository.create({
      Name: payload.Name,
      Email: payload.Email,
      Password: hashedPassword,
      Address: payload.Address,
      Role: payload.Role ?? ROLES.CUSTOMER,
    });

    return {
      user: sanitizeUser(user),
      token: this.signToken(user),
    };
  }

  async login(payload: LoginInput) {
    const user = await this.userRepository.findByEmail(payload.Email);

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { isMatch, shouldUpgradeHash } = await this.verifyPassword(
      payload.Password,
      user.Password,
    );

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (shouldUpgradeHash) {
      const upgradedPassword = await this.hashPassword(payload.Password);
      user.Password = upgradedPassword;
      await this.userRepository.update(user.UserID, {
        Password: upgradedPassword,
      });
    }

    return {
      user: sanitizeUser(user),
      token: this.signToken(user),
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return sanitizeUser(user);
  }
}
