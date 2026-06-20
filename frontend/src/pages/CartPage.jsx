import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCart } from "@/hooks/useCart";
import { cartService } from "@/services/cartService";
import { resolveAssetPath } from "@/utils/assets";

export default function CartPage() {
  const { refreshCartCount } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCart() {
    setLoading(true);
    setError("");
    try {
      const result = await cartService.getCart();
      setItems(result);
    } catch (reason) {
      setError(reason.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = Number(item.Product?.SalePrice || item.Product?.Price || 0);
        return sum + price * Number(item.Quantity || 0);
      }, 0),
    [items],
  );
  const hasStockIssues = useMemo(
    () => items.some((item) => Number(item.Quantity || 0) > Number(item.Product?.Stock ?? 0)),
    [items],
  );

  async function updateQuantity(cartId, nextQuantity) {
    try {
      await cartService.updateItem(cartId, nextQuantity);
      await refreshCartCount();
      await loadCart();
    } catch (reason) {
      window.alert(reason.message || "Failed to update cart");
    }
  }

  async function removeItem(cartId) {
    try {
      await cartService.removeItem(cartId);
      await refreshCartCount();
      await loadCart();
    } catch (reason) {
      window.alert(reason.message || "Failed to remove item from cart");
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading cart..." />;
  }

  return (
    <div className="container py-5 px-3 sm:px-4">
      <h2 className="mb-4 text-center text-2xl font-bold">Shopping Cart</h2>
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {!items.length ? (
        <EmptyState title="Your cart is empty" description="Add some products and come back." />
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="table-responsive rounded-lg border border-slate-200">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const price = Number(item.Product?.SalePrice || item.Product?.Price || 0);
                  const stock = Number(item.Product?.Stock ?? 0);
                  const stockIssue = Number(item.Quantity || 0) > stock;
                  const lineTotal = price * Number(item.Quantity || 0);
                  return (
                    <tr key={item.CartID}>
                      <td>
                        <div className="d-flex align-items-center gap-3 min-w-56">
                          <img
                            src={resolveAssetPath(item.Product?.Images)}
                            alt={item.Product?.Name || "Product"}
                            className="cart-item-image"
                          />
                          <div>
                            <div className="fw-semibold">{item.Product?.Name || "Unknown Product"}</div>
                            <div className="text-muted small">{item.Product?.Category || "Uncategorized"}</div>
                            <div className={`small fw-semibold ${stockIssue ? "text-danger" : "text-muted"}`}>
                              {stock > 0 ? `${stock} in stock` : "Out of stock"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{price.toFixed(2)} KM</td>
                      <td>
                        <div className="quantity-control">
                          <button
                            className="quantity-control-button"
                            type="button"
                            onClick={() => updateQuantity(item.CartID, Math.max(1, item.Quantity - 1))}
                          >
                            -
                          </button>
                          <span className="quantity-control-value">{item.Quantity}</span>
                          <button
                            className="quantity-control-button"
                            type="button"
                            onClick={() => updateQuantity(item.CartID, item.Quantity + 1)}
                            disabled={item.Quantity >= stock}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{lineTotal.toFixed(2)} KM</td>
                      <td>
                        <button className="btn btn-sm btn-danger min-h-10" type="button" onClick={() => removeItem(item.CartID)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-lg">
              <div className="card-body p-4">
                <h3 className="h5 fw-bolder mb-4">Order Summary</h3>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Items</span>
                  <span>{items.length}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span>{total.toFixed(2)} KM</span>
                </div>
                <div className="d-flex justify-content-between mb-4">
                  <span className="text-muted">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                  <span>Total</span>
                  <span>{total.toFixed(2)} KM</span>
                </div>
                {hasStockIssues ? (
                  <>
                    <div className="alert alert-danger py-2">
                      Update cart quantities before checkout.
                    </div>
                    <button className="btn btn-dark w-100 min-h-12" type="button" disabled>
                      Proceed to Checkout
                    </button>
                  </>
                ) : (
                  <Link to="/checkout" className="btn btn-dark w-100 min-h-12">
                    Proceed to Checkout
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
