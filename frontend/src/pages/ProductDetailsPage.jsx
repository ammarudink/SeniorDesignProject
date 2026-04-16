import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductGrid from "@/components/ProductGrid";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { useWishlist } from "@/hooks/useWishlist";
import { productService } from "@/services/productService";
import { resolveAssetPath } from "@/utils/assets";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    productService
      .getProductById(id)
      .then(async (currentProduct) => {
        setProduct(currentProduct);
        if (currentProduct?.Category) {
          const related = await productService.getRelatedProducts(
            currentProduct.Category,
            currentProduct.ProductID,
            4,
          );
          setRelatedProducts(related);
        } else {
          setRelatedProducts([]);
        }
      })
      .catch((reason) => setError(reason.message || "Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const wished = useMemo(
    () => (product ? isInWishlist(product.ProductID) : false),
    [product, isInWishlist],
  );

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await addToCart(product.ProductID, 1);
      showToast("Product added to cart");
    } catch (reason) {
      showToast(reason.message || "Failed to add product to cart", "danger");
    }
  }

  async function handleWishlist() {
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
    } catch (reason) {
      window.alert(reason.message || "Failed to update wishlist");
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading product..." />;
  }

  if (error || !product) {
    return (
      <section className="py-5">
        <div className="container px-4 px-lg-5 my-5 text-center">
          <h2 className="h4 mb-2">Product not found</h2>
          <p className="mb-3">{error || "The requested product could not be loaded."}</p>
          <Link className="btn btn-outline-dark" to="/products">
            Back to products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-5">
        <div className="container px-4 px-lg-5 my-5">
          <div className="row gx-4 gx-lg-5 align-items-center">
            <div className="col-md-6">
              <img className="product-detail-image" src={resolveAssetPath(product.Images)} alt={product.Name} />
            </div>
            <div className="col-md-6">
              <div className="small text-muted mb-2">Category: {product.Category || "Uncategorized"}</div>
              <h1 className="display-5 fw-bolder">{product.Name}</h1>
              <div className="fs-5 mb-5">
                {product.SalePrice ? (
                  <>
                    <span className="text-muted text-decoration-line-through">{product.Price}KM</span>
                    <span className="text-danger ms-2">{product.SalePrice}KM</span>
                  </>
                ) : (
                  <span>{product.Price}KM</span>
                )}
              </div>
              <p className="lead">{product.Description || "No description available."}</p>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-dark flex-shrink-0" type="button" onClick={handleAddToCart}>
                  <i className="bi-cart-fill me-1" />
                  Add to cart
                </button>
                <button className="btn btn-link p-0" type="button" onClick={handleWishlist}>
                  <img
                    src={wished ? "/assets/fheart.png" : "/assets/nfheart.png"}
                    style={{ width: 24, height: 24, cursor: "pointer" }}
                    alt="Wishlist"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-5 bg-light">
        <div className="container px-4 px-lg-5 mt-5">
          <h2 className="fw-bolder mb-4">Related products</h2>
          <ProductGrid products={relatedProducts} emptyTitle="No related products found" />
        </div>
      </section>
    </>
  );
}
