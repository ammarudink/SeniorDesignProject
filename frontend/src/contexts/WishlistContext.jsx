import { createContext, useEffect, useMemo, useState } from "react";
import { wishlistService } from "@/services/wishlistService";
import { useAuth } from "@/hooks/useAuth";

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);

  async function refreshWishlist() {
    if (!isAuthenticated) {
      setWishlistIds([]);
      return [];
    }

    const items = await wishlistService.getWishlist();
    const ids = items.map((item) => Number(item.ProductID));
    setWishlistIds(ids);
    return items;
  }

  useEffect(() => {
    refreshWishlist().catch(() => setWishlistIds([]));
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      wishlistIds,
      isInWishlist(productId) {
        return wishlistIds.includes(Number(productId));
      },
      refreshWishlist,
      async addToWishlist(productId) {
        const result = await wishlistService.addItem(productId);
        await refreshWishlist();
        return result;
      },
      async removeFromWishlist(productId) {
        await wishlistService.removeItem(productId);
        await refreshWishlist();
      },
    }),
    [wishlistIds],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
