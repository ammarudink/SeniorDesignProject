const toNumber = (value: unknown) =>
  value === null || value === undefined ? value : Number(value);

export const serializeProduct = <T extends Record<string, unknown>>(product: T) => ({
  ...product,
  Price: toNumber(product.Price),
  SalePrice: toNumber(product.SalePrice),
});

export const serializeCartItem = <T extends Record<string, unknown>>(cartItem: T) => ({
  ...cartItem,
  Product:
    cartItem.Product && typeof cartItem.Product === "object"
      ? serializeProduct(cartItem.Product as Record<string, unknown>)
      : cartItem.Product,
});

export const serializeOrder = <T extends Record<string, unknown>>(order: T) => ({
  ...order,
  TotalAmount: toNumber(order.TotalAmount),
  OrderItems:
    Array.isArray(order.OrderItems)
      ? order.OrderItems.map((item) => ({
          ...(item as Record<string, unknown>),
          Price: toNumber((item as Record<string, unknown>).Price),
          Product:
            (item as Record<string, unknown>).Product &&
            typeof (item as Record<string, unknown>).Product === "object"
              ? serializeProduct(
                  (item as Record<string, unknown>).Product as Record<string, unknown>,
                )
              : (item as Record<string, unknown>).Product,
        }))
      : order.OrderItems,
  Payments:
    Array.isArray(order.Payments)
      ? order.Payments.map((payment) => ({
          ...(payment as Record<string, unknown>),
          Amount: toNumber((payment as Record<string, unknown>).Amount),
        }))
      : order.Payments,
});
