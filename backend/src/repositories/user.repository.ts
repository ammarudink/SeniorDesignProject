import { Prisma, User } from "@prisma/client";
import { prisma } from "../config/prisma";

export class UserRepository {
  findMany() {
    return prisma.user.findMany({
      orderBy: {
        UserID: "desc",
      },
    });
  }

  findById(userId: number) {
    return prisma.user.findUnique({
      where: { UserID: userId },
    });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { Email: email },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  update(userId: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { UserID: userId },
      data,
    });
  }

  delete(userId: number): Promise<User> {
    return prisma.user.delete({
      where: { UserID: userId },
    });
  }
}
