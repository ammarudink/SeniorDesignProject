import { Request, Response } from "express";
import { OrderService } from "../services/order.service";

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

  list = async (req: Request, res: Response) => {
    const data = await this.orderService.getOrders(req.user!.userId, req.user!.role);

    res.status(200).json({
      success: true,
      data,
    });
  };

  getById = async (req: Request, res: Response) => {
    const data = await this.orderService.getOrderById(Number(req.params.orderId), req.user!);

    res.status(200).json({
      success: true,
      data,
    });
  };

  create = async (req: Request, res: Response) => {
    const data = await this.orderService.createOrder(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data,
    });
  };

  updateStatus = async (req: Request, res: Response) => {
    const data = await this.orderService.updateOrderStatus(Number(req.params.orderId), req.body.Status);

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data,
    });
  };
}
