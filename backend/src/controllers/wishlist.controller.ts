import { Request, Response } from "express";
import { WishlistService } from "../services/wishlist.service";

export class WishlistController {
  constructor(private readonly wishlistService = new WishlistService()) {}

  list = async (req: Request, res: Response) => {
    const data = await this.wishlistService.getWishlist(req.user!.userId);

    res.status(200).json({
      success: true,
      data,
    });
  };

  add = async (req: Request, res: Response) => {
    const data = await this.wishlistService.addItem(req.user!.userId, req.body.ProductID);

    res.status(201).json({
      success: true,
      message: "Item added to wishlist",
      data,
    });
  };

  remove = async (req: Request, res: Response) => {
    await this.wishlistService.removeItem(req.user!.userId, Number(req.params.productId));

    res.status(204).send();
  };
}
