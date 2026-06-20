import { CartRepository } from "../repositories/cart.repository";
import { ProductRepository } from "../repositories/product.repository";
import { ApiError } from "../utils/api-error";
import { serializeCartItem } from "../utils/serializers";

export class CartService {
  constructor(
    private readonly cartRepository = new CartRepository(),
    private readonly productRepository = new ProductRepository(),
  ) {}

  async getCart(userId: number) {
    const items = await this.cartRepository.findByUserId(userId);
    return items.map((item) => serializeCartItem(item));
  }

  async addItem(userId: number, productId: number, quantity: number) {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const existingItem = await this.cartRepository.findByUserAndProduct(userId, productId);
    const nextQuantity = (existingItem?.Quantity ?? 0) + quantity;

    if (product.Stock <= 0) {
      throw new ApiError(400, "Product is out of stock");
    }

    if (nextQuantity > product.Stock) {
      throw new ApiError(400, `Only ${product.Stock} item(s) available in stock`);
    }

    const item = existingItem
      ? await this.cartRepository.update(existingItem.CartID, {
          Quantity: nextQuantity,
        })
      : await this.cartRepository.create(userId, productId, quantity);

    return serializeCartItem(item);
  }

  async updateItem(userId: number, cartId: number, quantity: number) {
    const item = await this.cartRepository.findById(cartId);

    if (!item || item.UserID !== userId) {
      throw new ApiError(404, "Cart item not found");
    }

    const stock = item.Product?.Stock ?? 0;

    if (quantity > stock) {
      throw new ApiError(400, `Only ${stock} item(s) available in stock`);
    }

    const updatedItem = await this.cartRepository.update(cartId, {
      Quantity: quantity,
    });

    return serializeCartItem(updatedItem);
  }

  async removeItem(userId: number, cartId: number) {
    const item = await this.cartRepository.findById(cartId);

    if (!item || item.UserID !== userId) {
      throw new ApiError(404, "Cart item not found");
    }

    await this.cartRepository.delete(cartId);
  }

  async clearCart(userId: number) {
    await this.cartRepository.clearByUserId(userId);
  }
}
