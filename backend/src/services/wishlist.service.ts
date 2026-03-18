import { ProductRepository } from "../repositories/product.repository";
import { WishlistRepository } from "../repositories/wishlist.repository";
import { ApiError } from "../utils/api-error";
import { serializeProduct } from "../utils/serializers";

export class WishlistService {
  constructor(
    private readonly wishlistRepository = new WishlistRepository(),
    private readonly productRepository = new ProductRepository(),
  ) {}

  async getWishlist(userId: number) {
    const items = await this.wishlistRepository.findByUserId(userId);
    return items.map((item) => ({
      ...item,
      Product: item.Product ? serializeProduct(item.Product) : null,
    }));
  }

  async addItem(userId: number, productId: number) {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const existingItem = await this.wishlistRepository.findByUserAndProduct(userId, productId);
    const item = existingItem ?? (await this.wishlistRepository.add(userId, productId));

    return {
      ...item,
      Product: item.Product ? serializeProduct(item.Product) : null,
    };
  }

  async removeItem(userId: number, productId: number) {
    const result = await this.wishlistRepository.remove(userId, productId);

    if (result.count === 0) {
      throw new ApiError(404, "Wishlist item not found");
    }
  }
}
