import { Request, Response } from "express";
import { CartService } from "../services/cart.service";

export class CartController {
  constructor(private readonly cartService = new CartService()) {}

  list = async (req: Request, res: Response) => {
    const data = await this.cartService.getCart(req.user!.userId);

    res.status(200).json({
      success: true,
      data,
    });
  };

  add = async (req: Request, res: Response) => {
    const data = await this.cartService.addItem(
      req.user!.userId,
      req.body.ProductID,
      req.body.Quantity,
    );

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      data,
    });
  };

  update = async (req: Request, res: Response) => {
    const data = await this.cartService.updateItem(
      req.user!.userId,
      Number(req.params.cartId),
      req.body.Quantity,
    );

    res.status(200).json({
      success: true,
      message: "Cart item updated",
      data,
    });
  };

  remove = async (req: Request, res: Response) => {
    await this.cartService.removeItem(req.user!.userId, Number(req.params.cartId));

    res.status(204).send();
  };

  clear = async (req: Request, res: Response) => {
    await this.cartService.clearCart(req.user!.userId);

    res.status(204).send();
  };
}
