import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export class OrderRepository {
  findMany() {
    return prisma.order.findMany({
      include: {
        OrderItems: {
          include: {
            Product: true,
          },
        },
        Payments: true,
        User: {
          select: {
            UserID: true,
            Name: true,
            Email: true,
            Address: true,
            Role: true,
          },
        },
      },
      orderBy: {
        OrderID: "desc",
      },
    });
  }

  findByUserId(userId: number) {
    return prisma.order.findMany({
      where: { UserID: userId },
      include: {
        OrderItems: {
          include: {
            Product: true,
          },
        },
        Payments: true,
      },
      orderBy: {
        OrderID: "desc",
      },
    });
  }

  findById(orderId: number) {
    return prisma.order.findUnique({
      where: { OrderID: orderId },
      include: {
        OrderItems: {
          include: {
            Product: true,
          },
        },
        Payments: true,
        User: {
          select: {
            UserID: true,
            Name: true,
            Email: true,
            Address: true,
            Role: true,
          },
        },
      },
    });
  }

  create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: {
        OrderItems: {
          include: {
            Product: true,
          },
        },
        Payments: true,
      },
    });
  }

  update(orderId: number, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { OrderID: orderId },
      data,
      include: {
        OrderItems: {
          include: {
            Product: true,
          },
        },
        Payments: true,
      },
    });
  }
}
