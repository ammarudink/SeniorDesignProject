import { createContext, useEffect, useMemo, useState } from "react";
import { cartService } from "@/services/cartService";
import { useAuth } from "@/hooks/useAuth";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  async function refreshCartCount() {
    if (!isAuthenticated) {
      setCartCount(0);
      return [];
    }

    const items = await cartService.getCart();
    const total = items.reduce((sum, item) => sum + Number(item.Quantity || 0), 0);
    setCartCount(total);
    return items;
  }

  useEffect(() => {
    refreshCartCount().catch(() => setCartCount(0));
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      cartCount,
      refreshCartCount,
      async addToCart(productId, quantity = 1) {
        const result = await cartService.addItem(productId, quantity);
        await refreshCartCount();
        return result;
      },
    }),
    [cartCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
