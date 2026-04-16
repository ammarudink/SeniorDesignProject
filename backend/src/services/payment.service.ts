import { PAYMENT_METHODS, PAYMENT_STATUSES, ROLES } from "../constants/roles";
import { OrderRepository } from "../repositories/order.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { ApiError } from "../utils/api-error";
import { validatePaymentPayload } from "../utils/payment-validation";

type CreatePaymentInput = {
  OrderID: number;
  PaymentMethod: string;
  CardNumber?: string;
  ExpirationDate?: string;
  Cvc?: string;
};

export class PaymentService {
  constructor(
    private readonly paymentRepository = new PaymentRepository(),
    private readonly orderRepository = new OrderRepository(),
  ) {}

  async getPayments(actor: { userId: number; role: string }) {
    if (actor.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Only admins can view all payments");
    }

    const payments = await this.paymentRepository.findAll();
    return payments.map((payment) => ({
      ...payment,
      Amount: Number(payment.Amount),
    }));
  }

  async createPayment(actor: { userId: number; role: string }, payload: CreatePaymentInput) {
    const order = await this.orderRepository.findById(payload.OrderID);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (!order.UserID) {
      throw new ApiError(400, "Order is missing a valid customer reference");
    }

    if (actor.role !== ROLES.ADMIN && order.UserID !== actor.userId) {
      throw new ApiError(403, "You can only pay for your own orders");
    }

    const existingPayments = await this.paymentRepository.findByOrderId(payload.OrderID);

    if (
      existingPayments.some(
        (payment) => payment.PaymentStatus === PAYMENT_STATUSES.COMPLETED,
      )
    ) {
      throw new ApiError(409, "Order has already been paid");
    }

    if (payload.PaymentMethod === PAYMENT_METHODS.CREDIT_CARD) {
      try {
        validatePaymentPayload(payload);
      } catch (reason) {
        throw new ApiError(400, reason instanceof Error ? reason.message : "Invalid payment details");
      }
    }

    const payment = await this.paymentRepository.create({
      Order: { connect: { OrderID: payload.OrderID } },
      User: { connect: { UserID: order.UserID } },
      Amount: order.TotalAmount,
      PaymentMethod: payload.PaymentMethod,
      PaymentStatus: PAYMENT_STATUSES.COMPLETED,
    });

    return {
      ...payment,
      Amount: Number(payment.Amount),
    };
  }
}
