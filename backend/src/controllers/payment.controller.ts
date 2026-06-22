import { Request, Response } from "express";
import { env } from "../config/env";
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

  providers = async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        stripe: Boolean(env.STRIPE_SECRET_KEY),
      },
    });
  };

  createStripeCheckoutSession = async (req: Request, res: Response) => {
    const data = await this.paymentService.createStripeCheckoutSession(req.user!, req.body);

    res.status(201).json({
      success: true,
      message: "Stripe checkout session created",
      data,
    });
  };

  completeStripeCheckout = async (req: Request, res: Response) => {
    const data = await this.paymentService.completeStripeCheckout(String(req.query.session_id || ""));

    res.status(200).json({
      success: true,
      message: "Stripe payment status updated",
      data,
    });
  };
}
