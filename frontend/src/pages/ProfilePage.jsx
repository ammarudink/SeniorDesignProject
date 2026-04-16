import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { userService } from "@/services/userService";

function formatPaymentMethod(value) {
  if (!value) {
    return "Not recorded";
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshProfile, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [priceForm, setPriceForm] = useState({ Price: "", SalePrice: "" });
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfileData() {
      setLoading(true);
      setError("");

      try {
        const [profileResult, orderResult] = await Promise.all([
          refreshProfile(),
          orderService.getOrders(),
        ]);

        if (!active) {
          return;
        }

        setProfile(profileResult);
        setOrders(orderResult);

        if (profileResult?.Role === "Admin") {
          const productResult = await productService.getProducts({ page: 1, limit: 100 });

          if (!active) {
            return;
          }

          const allProducts = productResult.products || [];
          setCatalog(allProducts);

          if (allProducts.length) {
            const firstProduct = allProducts[0];
            setSelectedProductId(String(firstProduct.ProductID));
            setPriceForm({
              Price: String(firstProduct.Price ?? ""),
              SalePrice:
                firstProduct.SalePrice === null || firstProduct.SalePrice === undefined
                  ? ""
                  : String(firstProduct.SalePrice),
            });
          }
        }
      } catch (reason) {
        if (!active) {
          return;
        }

        setError(reason.message || "Failed to load profile");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfileData();

    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => catalog.find((item) => String(item.ProductID) === String(selectedProductId)),
    [catalog, selectedProductId],
  );

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    setPriceForm({
      Price: String(selectedProduct.Price ?? ""),
      SalePrice:
        selectedProduct.SalePrice === null || selectedProduct.SalePrice === undefined
          ? ""
          : String(selectedProduct.SalePrice),
    });
  }, [selectedProduct]);

  async function handleDeleteAccount() {
    if (!profile?.UserID) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await userService.deleteUser(profile.UserID);
      logout();
      navigate("/login", { replace: true });
    } catch (reason) {
      setError(reason.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdateProduct(event) {
    event.preventDefault();

    if (!selectedProductId) {
      return;
    }

    setSavingProduct(true);
    setError("");
    setSuccess("");

    try {
      await productService.updateProduct(selectedProductId, {
        Price: Number(priceForm.Price),
        SalePrice: priceForm.SalePrice === "" ? null : Number(priceForm.SalePrice),
      });

      setSuccess("Product updated successfully");

      const productResult = await productService.getProducts({ page: 1, limit: 100 });
      const allProducts = productResult.products || [];
      setCatalog(allProducts);
    } catch (reason) {
      setError(reason.message || "Failed to update product");
    } finally {
      setSavingProduct(false);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  return (
    <div className="container py-5">
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card mb-4">
        <div className="card-header">
          <h2 className="h4 mb-0">Profile</h2>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" value={profile?.Name || ""} readOnly />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" value={profile?.Email || ""} readOnly />
          </div>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input className="form-control" value={profile?.Address || ""} readOnly />
          </div>
          <div className="mb-0">
            <label className="form-label">Role</label>
            <input className="form-control" value={profile?.Role || ""} readOnly />
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h2 className="h4 mb-0">Order History</h2>
        </div>
        <div className="card-body">
          {!orders.length ? (
            <p className="text-muted mb-0">No orders found yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.OrderID;
                    const payment = order.Payments?.[0];

                    return (
                      <Fragment key={order.OrderID}>
                        <tr>
                          <td>{order.OrderID}</td>
                          <td>{Number(order.TotalAmount || 0).toFixed(2)} KM</td>
                          <td>{order.Status}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark"
                              onClick={() =>
                                setExpandedOrderId((previous) =>
                                  previous === order.OrderID ? null : order.OrderID,
                                )
                              }
                            >
                              {isExpanded ? "Hide Details" : "View Details"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr>
                            <td colSpan="4" className="border-0 pt-0">
                              <div className="order-details-panel">
                                <div className="row g-4">
                                  <div className="col-lg-7">
                                    <h3 className="h6 fw-bolder mb-3">Items</h3>
                                    <div className="order-details-list">
                                      {(order.OrderItems || []).map((item) => {
                                        const unitPrice = Number(item.Price || item.Product?.Price || 0);
                                        const quantity = Number(item.Quantity || 0);

                                        return (
                                          <div
                                            className="order-details-item"
                                            key={item.OrderItemID || `${order.OrderID}-${item.ProductID}`}
                                          >
                                            <div>
                                              <div className="fw-semibold">{item.Product?.Name || "Product"}</div>
                                              <div className="text-muted small">
                                                Qty: {quantity} x {unitPrice.toFixed(2)} KM
                                              </div>
                                            </div>
                                            <div className="fw-semibold">
                                              {(unitPrice * quantity).toFixed(2)} KM
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div className="col-lg-5">
                                    <h3 className="h6 fw-bolder mb-3">Summary</h3>
                                    <div className="order-details-meta">
                                      <div className="order-details-meta-row">
                                        <span>Payment</span>
                                        <span>{formatPaymentMethod(payment?.PaymentMethod)}</span>
                                      </div>
                                      <div className="order-details-meta-row">
                                        <span>Total</span>
                                        <span>{Number(order.TotalAmount || 0).toFixed(2)} KM</span>
                                      </div>
                                      {order.User?.Name ? (
                                        <div className="order-customer-card">
                                          <div className="fw-semibold mb-2">Customer</div>
                                          <div>{order.User.Name}</div>
                                          <div className="text-muted small">{order.User.Email}</div>
                                          <div className="text-muted small">{order.User.Address}</div>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
        {profile?.Role === "Admin" ? (
          <button
            type="button"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#adminProductModal"
          >
            Update Product Prices
          </button>
        ) : null}
      </div>

      {profile?.Role === "Admin" ? (
        <div
          className="modal fade"
          id="adminProductModal"
          tabIndex="-1"
          aria-labelledby="adminProductModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title h5" id="adminProductModalLabel">
                  Update Product Prices
                </h3>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <form onSubmit={handleUpdateProduct}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="adminProductSelect" className="form-label">
                        Select Product
                      </label>
                      <select
                        id="adminProductSelect"
                        className="form-select"
                        value={selectedProductId}
                        onChange={(event) => setSelectedProductId(event.target.value)}
                      >
                        {catalog.map((product) => (
                          <option key={product.ProductID} value={product.ProductID}>
                            {product.Name} - Current Price: {product.Price}KM
                            {product.SalePrice ? ` (Sale: ${product.SalePrice}KM)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="adminPrice" className="form-label">
                        New Price
                      </label>
                      <input
                        id="adminPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={priceForm.Price}
                        onChange={(event) =>
                          setPriceForm((previous) => ({ ...previous, Price: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="adminSalePrice" className="form-label">
                        Sale Price
                      </label>
                      <input
                        id="adminSalePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={priceForm.SalePrice}
                        onChange={(event) =>
                          setPriceForm((previous) => ({ ...previous, SalePrice: event.target.value }))
                        }
                        placeholder="Leave empty to remove"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                    Close
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={savingProduct}>
                    {savingProduct ? "Updating..." : "Update Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
