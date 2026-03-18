import { prisma } from "../config/prisma";

export class WishlistRepository {
  findByUserId(userId: number) {
    return prisma.wishlistItem.findMany({
      where: { UserID: userId },
      include: {
        Product: true,
      },
      orderBy: {
        WishlistID: "desc",
      },
    });
  }

  findByUserAndProduct(userId: number, productId: number) {
    return prisma.wishlistItem.findFirst({
      where: {
        UserID: userId,
        ProductID: productId,
      },
      include: {
        Product: true,
      },
      orderBy: {
        WishlistID: "desc",
      },
    });
  }

  add(userId: number, productId: number) {
    return prisma.wishlistItem.create({
      data: {
        User: { connect: { UserID: userId } },
        Product: { connect: { ProductID: productId } },
      },
      include: {
        Product: true,
      },
    });
  }

  remove(userId: number, productId: number) {
    return prisma.wishlistItem.deleteMany({
      where: {
        UserID: userId,
        ProductID: productId,
      },
    });
  }
}
