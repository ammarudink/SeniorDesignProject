import { ProductRepository } from "../repositories/product.repository";
import { ApiError } from "../utils/api-error";
import { getPagination } from "../utils/pagination";
import { serializeProduct } from "../utils/serializers";

type ListProductsInput = {
  page?: number;
  limit?: number;
  search?: string;
  categories?: string[];
  onSale?: boolean;
  sort?: string;
};

type UpsertProductInput = {
  Name?: string;
  Price?: number;
  SalePrice?: number | null;
  Category?: string;
  Images?: string;
  Description?: string;
  Stock?: number;
};

export class ProductService {
  constructor(private readonly productRepository = new ProductRepository()) {}

  async listProducts(filters: ListProductsInput) {
    const { page, limit, skip } = getPagination(filters.page, filters.limit);

    const [products, total] = await Promise.all([
      this.productRepository.findMany({
        ...filters,
        skip,
        take: limit,
      }),
      this.productRepository.count(filters),
    ]);

    return {
      products: products.map((product) => serializeProduct(product)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getDashboardProducts(limit = 8) {
    const products = await this.productRepository.findDashboard(limit);
    return products.map((product) => serializeProduct(product));
  }

  async getCategories() {
    const categories = await this.productRepository.findCategories();
    return categories.map((entry) => entry.Category);
  }

  async getProductById(productId: number) {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return serializeProduct(product);
  }

  async getRelatedProducts(category: string, exclude?: number, limit?: number) {
    const products = await this.productRepository.findRelated(category, exclude, limit ?? 4);
    return products.map((product) => serializeProduct(product));
  }

  async createProduct(payload: UpsertProductInput) {
    const product = await this.productRepository.create({
      Name: payload.Name!,
      Price: payload.Price!,
      SalePrice: payload.SalePrice,
      Category: payload.Category!,
      Images: payload.Images!,
      Description: payload.Description!,
      Stock: payload.Stock!,
    });

    return serializeProduct(product);
  }

  async updateProduct(productId: number, payload: UpsertProductInput) {
    await this.getProductById(productId);

    const product = await this.productRepository.update(productId, payload);
    return serializeProduct(product);
  }

  async deleteProduct(productId: number) {
    const existingProduct = await this.productRepository.findById(productId);

    if (!existingProduct) {
      throw new ApiError(404, "Product not found");
    }

    await this.productRepository.delete(productId);
  }
}
