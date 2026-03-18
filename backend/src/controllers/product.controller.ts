import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

export class ProductController {
  constructor(private readonly productService = new ProductService()) {}

  list = async (req: Request, res: Response) => {
    const data = await this.productService.listProducts(req.query as Record<string, unknown>);

    res.status(200).json({
      success: true,
      data,
    });
  };

  dashboard = async (req: Request, res: Response) => {
    const query = req.query as { limit?: number };
    const data = await this.productService.getDashboardProducts(query.limit);

    res.status(200).json({
      success: true,
      data,
    });
  };

  categories = async (_req: Request, res: Response) => {
    const data = await this.productService.getCategories();

    res.status(200).json({
      success: true,
      data,
    });
  };

  getById = async (req: Request, res: Response) => {
    const data = await this.productService.getProductById(Number(req.params.productId));

    res.status(200).json({
      success: true,
      data,
    });
  };

  related = async (req: Request, res: Response) => {
    const query = req.query as unknown as {
      category: string;
      exclude?: number;
      limit?: number;
    };
    const data = await this.productService.getRelatedProducts(
      query.category,
      query.exclude,
      query.limit,
    );

    res.status(200).json({
      success: true,
      data,
    });
  };

  create = async (req: Request, res: Response) => {
    const data = await this.productService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data,
    });
  };

  update = async (req: Request, res: Response) => {
    const data = await this.productService.updateProduct(Number(req.params.productId), req.body);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data,
    });
  };

  delete = async (req: Request, res: Response) => {
    await this.productService.deleteProduct(Number(req.params.productId));

    res.status(204).send();
  };
}
