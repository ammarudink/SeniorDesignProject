import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { useWishlist } from "@/hooks/useWishlist";
import { resolveAssetPath } from "@/utils/assets";

export default function ProductCard({ product, onWishlistChange }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const onSale = Boolean(product.SalePrice);
  const wished = isInWishlist(product.ProductID);
  const stock = Number(product.Stock ?? 0);
  const outOfStock = stock <= 0;

  async function handleAddToCart(event) {
    event.preventDefault();
    if (outOfStock) {
      showToast("Product is out of stock", "danger");
      return;
    }

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

      await onWishlistChange?.(product.ProductID);
    } catch (error) {
      window.alert(error.message || "Failed to update wishlist");
    }
  }

  return (
    <article className="product-card card h-100 overflow-hidden border shadow-sm">
      <div className="product-card-media">
        {onSale ? <span className="product-card-badge">Sale</span> : null}
        {outOfStock ? <span className="product-card-stock-badge">Out of stock</span> : null}
        <button
          className="product-card-wishlist"
          type="button"
          onClick={handleWishlist}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <img
            src={wished ? "/assets/fheart.png" : "/assets/nfheart.png"}
            alt=""
            aria-hidden="true"
          />
        </button>
        <Link to={`/products/${product.ProductID}`} className="product-card-image-link">
          <img className="product-card-image" src={resolveAssetPath(product.Images)} alt={product.Name} />
        </Link>
      </div>
      <div className="card-body product-card-body">
        <div className="product-card-category">{product.Category || "Product"}</div>
        <Link to={`/products/${product.ProductID}`} className="product-card-title-link">
          <h5 className="product-card-title">{product.Name}</h5>
        </Link>
        <div className="product-card-price">
          {onSale ? (
            <>
              <span className="product-card-price-old">{product.Price}KM</span>
              <span className="product-card-price-sale">{product.SalePrice}KM</span>
            </>
          ) : (
            <span>{product.Price}KM</span>
          )}
        </div>
        <div className={`product-card-stock ${outOfStock ? "text-danger" : "text-muted"}`}>
          {outOfStock ? "Unavailable" : `${stock} in stock`}
        </div>
      </div>
      <div className="card-footer product-card-footer border-top-0 bg-transparent">
        <button
          className="btn btn-dark min-h-11 w-100"
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
