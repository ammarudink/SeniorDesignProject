import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { useWishlist } from "@/hooks/useWishlist";
import { resolveAssetPath } from "@/utils/assets";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const onSale = Boolean(product.SalePrice);
  const wished = isInWishlist(product.ProductID);

  async function handleAddToCart(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await addToCart(product.ProductID, 1);
      showToast("Product added to cart");
    } catch (error) {
      showToast(error.message || "Failed to add product to cart", "danger");
    }
  }

  async function handleWishlist(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      if (wished) {
        await removeFromWishlist(product.ProductID);
      } else {
        await addToWishlist(product.ProductID);
      }
    } catch (error) {
      window.alert(error.message || "Failed to update wishlist");
    }
  }

  return (
    <div className="col mb-5">
      <div className="card h-100">
        {onSale ? (
          <div className="badge bg-dark text-white position-absolute" style={{ top: "0.5rem", right: "0.5rem" }}>
            Sale
          </div>
        ) : null}
        <Link to={`/products/${product.ProductID}`} className="text-decoration-none">
          <img className="card-img-top" src={resolveAssetPath(product.Images)} alt={product.Name} />
        </Link>
        <div className="card-body p-4">
          <div className="text-center">
            <Link to={`/products/${product.ProductID}`} className="text-decoration-none text-dark">
              <h5 className="fw-bolder">{product.Name}</h5>
            </Link>
            <div className="price mb-3">
              {onSale ? (
                <>
                  <span className="text-muted text-decoration-line-through">{product.Price}KM</span>{" "}
                  {product.SalePrice}KM
                </>
              ) : (
                <>{product.Price}KM</>
              )}
            </div>
          </div>
        </div>
        <div className="card-footer p-4 pt-0 border-top-0 bg-transparent">
          <div className="text-center">
            <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
              <button className="btn btn-outline-dark" type="button" onClick={handleAddToCart}>
                Add to cart
              </button>
              <button className="btn btn-link p-0" type="button" onClick={handleWishlist}>
                <img
                  src={wished ? "/assets/fheart.png" : "/assets/nfheart.png"}
                  style={{ width: 24, height: 24, cursor: "pointer" }}
                  alt="Add to wishlist"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
