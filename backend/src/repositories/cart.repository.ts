import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export class CartRepository {
  findByUserId(userId: number) {
    return prisma.cartItem.findMany({
      where: { UserID: userId },
      include: {
        Product: true,
      },
      orderBy: {
        AddedAt: "desc",
      },
    });
  }

  findById(cartId: number) {
    return prisma.cartItem.findUnique({
      where: { CartID: cartId },
      include: {
        Product: true,
      },
    });
  }

  findByUserAndProduct(userId: number, productId: number) {
    return prisma.cartItem.findFirst({
      where: {
        UserID: userId,
        ProductID: productId,
      },
      include: {
        Product: true,
      },
      orderBy: {
        CartID: "desc",
      },
    });
  }

  create(userId: number, productId: number, quantity: number) {
    return prisma.cartItem.create({
      data: {
        User: { connect: { UserID: userId } },
        Product: { connect: { ProductID: productId } },
        Quantity: quantity,
      },
      include: {
        Product: true,
      },
    });
  }

  update(cartId: number, data: Prisma.CartItemUpdateInput) {
    return prisma.cartItem.update({
      where: { CartID: cartId },
      data,
      include: {
        Product: true,
      },
    });
  }

  delete(cartId: number) {
    return prisma.cartItem.delete({
      where: { CartID: cartId },
    });
  }

  clearByUserId(userId: number) {
    return prisma.cartItem.deleteMany({
      where: { UserID: userId },
    });
  }
}
