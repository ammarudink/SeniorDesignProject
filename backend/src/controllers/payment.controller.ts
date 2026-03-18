import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";

export class PaymentController {
  constructor(private readonly paymentService = new PaymentService()) {}

  list = async (req: Request, res: Response) => {
    const data = await this.paymentService.getPayments(req.user!);

    res.status(200).json({
      success: true,
      data,
    });
  };

  create = async (req: Request, res: Response) => {
    const data = await this.paymentService.createPayment(req.user!, req.body);

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data,
    });
  };
}
