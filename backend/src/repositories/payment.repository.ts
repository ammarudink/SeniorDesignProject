import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export class PaymentRepository {
  findAll() {
    return prisma.payment.findMany({
      include: {
        Order: true,
      },
      orderBy: {
        PaymentID: "desc",
      },
    });
  }

  findById(paymentId: number) {
    return prisma.payment.findUnique({
      where: { PaymentID: paymentId },
      include: {
        Order: true,
      },
    });
  }

  findByOrderId(orderId: number) {
    return prisma.payment.findMany({
      where: { OrderID: orderId },
      orderBy: {
        PaymentID: "desc",
      },
    });
  }

  create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({
      data,
    });
  }
}
