import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductGrid from "@/components/ProductGrid";
import { wishlistService } from "@/services/wishlistService";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWishlist() {
    setLoading(true);
    setError("");

    try {
      const result = await wishlistService.getWishlist();
      setItems(result);
    } catch (reason) {
      setError(reason.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading wishlist..." />;
  }

  if (error) {
    return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
  }

  const products = items.map((item) => item.Product).filter(Boolean);

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Your Wishlist</h2>
      {!products.length ? (
        <EmptyState title="Your wishlist is empty" description="Save products here to find them faster later." />
      ) : (
        <ProductGrid
          products={products}
          emptyTitle="Your wishlist is empty"
          onWishlistChange={loadWishlist}
        />
      )}
    </div>
  );
}
