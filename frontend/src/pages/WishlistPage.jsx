import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { wishlistService } from "@/services/wishlistService";
import { useWishlist } from "@/hooks/useWishlist";
import { resolveAssetPath } from "@/utils/assets";

export default function WishlistPage() {
  const { refreshWishlist } = useWishlist();
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

  async function removeItem(productId) {
    try {
      await wishlistService.removeItem(productId);
      await refreshWishlist();
      await loadWishlist();
    } catch (reason) {
      window.alert(reason.message || "Failed to remove wishlist item");
    }
  }

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
        <div className="row gx-4 gx-lg-5 row-cols-2 row-cols-md-3 row-cols-xl-4 justify-content-center">
                {products.map((product) => (
                  <div className="col mb-5" key={product.ProductID}>
                    <div className="card h-100">
                      <Link to={`/products/${product.ProductID}`} className="text-decoration-none">
                        <img className="card-img-top" src={resolveAssetPath(product.Images)} alt={product.Name} />
                      </Link>
                <div className="card-body p-4 text-center">
                        <Link
                          to={`/products/${product.ProductID}`}
                          className="text-decoration-none text-dark"
                        >
                          <h5 className="fw-bolder">{product.Name}</h5>
                        </Link>
                  <div className="price mb-3">
                    {product.SalePrice ? (
                      <>
                        <span className="text-muted text-decoration-line-through">{product.Price}KM</span> {product.SalePrice}KM
                      </>
                    ) : (
                      <>{product.Price}KM</>
                    )}
                  </div>
                </div>
                <div className="card-footer p-4 pt-0 border-top-0 bg-transparent text-center">
                  <button className="btn btn-outline-dark mt-auto" type="button" onClick={() => removeItem(product.ProductID)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
