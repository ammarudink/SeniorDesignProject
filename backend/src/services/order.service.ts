import { Prisma, Product } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../constants/roles";
import { CartRepository } from "../repositories/cart.repository";
import { OrderRepository } from "../repositories/order.repository";
import { ProductRepository } from "../repositories/product.repository";
import { ApiError } from "../utils/api-error";
import { validatePaymentPayload } from "../utils/payment-validation";
import { serializeOrder } from "../utils/serializers";

type OrderItemInput = {
  ProductID: number;
  Quantity: number;
};

type CreateOrderInput = {
  items?: OrderItemInput[];
  useCart?: boolean;
  paymentMethod: string;
  CardNumber?: string;
  ExpirationDate?: string;
  Cvc?: string;
};

type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

type ResolvedOrderItem = {
  ProductID: number;
  Quantity: number;
  Product: Product;
};

function getRequiredStockByProduct(items: ResolvedOrderItem[]) {
  const requiredStock = new Map<number, { quantity: number; product: Product }>();

  items.forEach((item) => {
    const current = requiredStock.get(item.ProductID);
    requiredStock.set(item.ProductID, {
      product: item.Product,
      quantity: (current?.quantity ?? 0) + item.Quantity,
    });
  });

  return requiredStock;
}

export class OrderService {
  constructor(
    private readonly orderRepository = new OrderRepository(),
    private readonly productRepository = new ProductRepository(),
    private readonly cartRepository = new CartRepository(),
  ) {}

  async getOrders(userId: number, role: string) {
    const orders =
      role === "Admin"
        ? await this.orderRepository.findMany()
        : await this.orderRepository.findByUserId(userId);

    return orders.map((order) => serializeOrder(order));
  }

  async getOrderById(orderId: number, actor: { userId: number; role: string }) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (actor.role !== "Admin" && order.UserID !== actor.userId) {
      throw new ApiError(403, "You can only access your own orders");
    }

    return serializeOrder(order);
  }

  async createOrder(userId: number, payload: CreateOrderInput) {
    if (payload.paymentMethod !== PAYMENT_METHODS.STRIPE) {
      try {
        validatePaymentPayload({
          PaymentMethod: payload.paymentMethod,
          CardNumber: payload.CardNumber,
          ExpirationDate: payload.ExpirationDate,
          Cvc: payload.Cvc,
        });
      } catch (reason) {
        throw new ApiError(400, reason instanceof Error ? reason.message : "Invalid payment details");
      }
    }

    const items =
      payload.useCart || !payload.items?.length
        ? await this.cartRepository.findByUserId(userId)
        : await Promise.all(
            payload.items.map(async (item) => {
              const product = await this.productRepository.findById(item.ProductID);

              if (!product) {
                throw new ApiError(404, `Product ${item.ProductID} not found`);
              }

              return {
                ProductID: item.ProductID,
                Quantity: item.Quantity,
                Product: product,
              };
            }),
          );

    if (items.length === 0) {
      throw new ApiError(400, "Cannot create an order without items");
    }

    const resolvedItems: ResolvedOrderItem[] = items.map((item) => {
      if (!item.Product || !item.ProductID) {
        throw new ApiError(400, "Cart contains invalid products");
      }

      return {
        ProductID: item.ProductID,
        Quantity: item.Quantity,
        Product: item.Product,
      };
    });

    const requiredStock = getRequiredStockByProduct(resolvedItems);

    requiredStock.forEach(({ product, quantity }) => {
      if (product.Stock <= 0) {
        throw new ApiError(400, `${product.Name} is out of stock`);
      }

      if (quantity > product.Stock) {
        throw new ApiError(400, `Only ${product.Stock} ${product.Name} item(s) available in stock`);
      }
    });

    const totalAmount = resolvedItems.reduce((sum, item) => {
      const unitPrice = Number(item.Product.SalePrice ?? item.Product.Price);
      return sum + unitPrice * item.Quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      for (const [productId, { product, quantity }] of requiredStock.entries()) {
        const updateResult = await tx.product.updateMany({
          where: {
            ProductID: productId,
            Stock: {
              gte: quantity,
            },
          },
          data: {
            Stock: {
              decrement: quantity,
            },
          },
        });

        if (updateResult.count !== 1) {
          throw new ApiError(400, `Not enough stock available for ${product.Name}`);
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          User: { connect: { UserID: userId } },
          TotalAmount: new Prisma.Decimal(totalAmount),
          Status: ORDER_STATUSES.PENDING,
          OrderItems: {
            create: resolvedItems.map((item) => ({
              Product: { connect: { ProductID: item.ProductID } },
              Quantity: item.Quantity,
              Price: new Prisma.Decimal(Number(item.Product.SalePrice ?? item.Product.Price)),
            })),
          },
          Payments: {
            create: {
              User: { connect: { UserID: userId } },
              Amount: new Prisma.Decimal(totalAmount),
              PaymentMethod: payload.paymentMethod,
              PaymentStatus:
                payload.paymentMethod === PAYMENT_METHODS.STRIPE
                  ? PAYMENT_STATUSES.PENDING
                  : PAYMENT_STATUSES.COMPLETED,
            },
          },
        },
        include: {
          OrderItems: {
            include: {
              Product: true,
            },
          },
          Payments: true,
        },
      });

      if (payload.useCart || !payload.items?.length) {
        await tx.cartItem.deleteMany({
          where: { UserID: userId },
        });
      }

      return createdOrder;
    });

    return serializeOrder(order);
  }

  async updateOrderStatus(orderId: number, status: OrderStatus) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const updatedOrder = await this.orderRepository.update(orderId, {
      Status: status,
    });

    return serializeOrder(updatedOrder);
  }
}
