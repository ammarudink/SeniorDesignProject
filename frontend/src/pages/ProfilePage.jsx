import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { userService } from "@/services/userService";

const ORDER_STATUSES = ["Pending", "Shipped", "Accepted", "Cancelled"];

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
  const [priceForm, setPriceForm] = useState({
    Price: "",
    SalePrice: "",
    Stock: "",
    Images: "",
    ImageFile: null,
  });
  const [createForm, setCreateForm] = useState({
    Name: "",
    Category: "",
    Description: "",
    Price: "",
    SalePrice: "",
    Stock: "",
    Images: "",
    ImageFile: null,
  });
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
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
              Stock: String(firstProduct.Stock ?? 0),
              Images: firstProduct.Images || "",
              ImageFile: null,
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
      Stock: String(selectedProduct.Stock ?? 0),
      Images: selectedProduct.Images || "",
      ImageFile: null,
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
      const payload = priceForm.ImageFile
        ? new FormData()
        : {
            Price: Number(priceForm.Price),
            SalePrice: priceForm.SalePrice === "" ? null : Number(priceForm.SalePrice),
            Stock: Number(priceForm.Stock),
            ...(priceForm.Images.trim() ? { Images: priceForm.Images.trim() } : {}),
          };

      if (payload instanceof FormData) {
        payload.append("Price", String(Number(priceForm.Price)));
        payload.append("SalePrice", priceForm.SalePrice === "" ? "" : String(Number(priceForm.SalePrice)));
        payload.append("Stock", String(Number(priceForm.Stock)));
        if (priceForm.Images.trim()) {
          payload.append("Images", priceForm.Images.trim());
        }
        payload.append("ImageFile", priceForm.ImageFile);
      }

      await productService.updateProduct(selectedProductId, payload);

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

  async function handleCreateProduct(event) {
    event.preventDefault();

    setCreatingProduct(true);
    setError("");
    setSuccess("");

    try {
      const payload = createForm.ImageFile
        ? new FormData()
        : {
            Name: createForm.Name.trim(),
            Category: createForm.Category.trim(),
            Description: createForm.Description.trim(),
            Price: Number(createForm.Price),
            SalePrice: createForm.SalePrice === "" ? undefined : Number(createForm.SalePrice),
            Stock: Number(createForm.Stock),
            Images: createForm.Images.trim(),
          };

      if (payload instanceof FormData) {
        payload.append("Name", createForm.Name.trim());
        payload.append("Category", createForm.Category.trim());
        payload.append("Description", createForm.Description.trim());
        payload.append("Price", String(Number(createForm.Price)));
        payload.append("SalePrice", createForm.SalePrice === "" ? "" : String(Number(createForm.SalePrice)));
        payload.append("Stock", String(Number(createForm.Stock)));
        if (createForm.Images.trim()) {
          payload.append("Images", createForm.Images.trim());
        }
        payload.append("ImageFile", createForm.ImageFile);
      }

      const createdProduct = await productService.createProduct(payload);

      setSuccess("Product created successfully");
      setCreateForm({
        Name: "",
        Category: "",
        Description: "",
        Price: "",
        SalePrice: "",
        Stock: "",
        Images: "",
        ImageFile: null,
      });

      const productResult = await productService.getProducts({ page: 1, limit: 100 });
      const allProducts = productResult.products || [];
      setCatalog(allProducts);
      setSelectedProductId(String(createdProduct.ProductID));
    } catch (reason) {
      setError(reason.message || "Failed to create product");
    } finally {
      setCreatingProduct(false);
    }
  }

  async function handleUpdateOrderStatus(orderId, status) {
    setUpdatingOrderId(orderId);
    setError("");
    setSuccess("");

    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.OrderID === orderId ? updatedOrder : order)),
      );
      setSuccess(`Order #${orderId} status updated`);
    } catch (reason) {
      setError(reason.message || "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  return (
    <div className="container py-5 px-3 sm:px-4">
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card mb-4 rounded-lg shadow-sm">
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

      <div className="card mb-4 rounded-lg shadow-sm">
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
                    const isUpdatingOrder = updatingOrderId === order.OrderID;

                    return (
                      <Fragment key={order.OrderID}>
                        <tr>
                          <td>{order.OrderID}</td>
                          <td>{Number(order.TotalAmount || 0).toFixed(2)} KM</td>
                          <td>
                            {profile?.Role === "Admin" ? (
                              <select
                                className="form-select form-select-sm order-status-select"
                                value={order.Status}
                                disabled={isUpdatingOrder}
                                onChange={(event) =>
                                  handleUpdateOrderStatus(order.OrderID, event.target.value)
                                }
                              >
                                {ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              order.Status
                            )}
                          </td>
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

      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3">
        <button
          type="button"
          className="btn btn-danger min-h-11"
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
        {profile?.Role === "Admin" ? (
          <div className="d-flex flex-column flex-sm-row gap-2">
            <button
              type="button"
              className="btn btn-outline-dark min-h-11"
              data-bs-toggle="modal"
              data-bs-target="#adminCreateProductModal"
            >
              Add Product
            </button>
            <button
              type="button"
              className="btn btn-dark min-h-11"
              data-bs-toggle="modal"
              data-bs-target="#adminProductModal"
            >
              Update Product
            </button>
          </div>
        ) : null}
      </div>

      {profile?.Role === "Admin" ? (
        <>
          <div
            className="modal fade"
            id="adminCreateProductModal"
            tabIndex="-1"
            aria-labelledby="adminCreateProductModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title h5" id="adminCreateProductModalLabel">
                    Add Product
                  </h3>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                </div>
                <form onSubmit={handleCreateProduct}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="createProductName" className="form-label">
                          Product Name
                        </label>
                        <input
                          id="createProductName"
                          className="form-control min-h-11"
                          maxLength={255}
                          value={createForm.Name}
                          onChange={(event) =>
                            setCreateForm((previous) => ({ ...previous, Name: event.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="createProductCategory" className="form-label">
                          Category
                        </label>
                        <input
                          id="createProductCategory"
                          className="form-control min-h-11"
                          maxLength={100}
                          value={createForm.Category}
                          onChange={(event) =>
                            setCreateForm((previous) => ({ ...previous, Category: event.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="createProductPrice" className="form-label">
                          Price
                        </label>
                        <input
                          id="createProductPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control min-h-11"
                          value={createForm.Price}
                          onChange={(event) =>
                            setCreateForm((previous) => ({ ...previous, Price: event.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="createProductSalePrice" className="form-label">
                          Sale Price
                        </label>
                        <input
                          id="createProductSalePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control min-h-11"
                          value={createForm.SalePrice}
                          onChange={(event) =>
                            setCreateForm((previous) => ({ ...previous, SalePrice: event.target.value }))
                          }
                          placeholder="Optional"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="createProductStock" className="form-label">
                          Stock Quantity
                        </label>
                        <input
                          id="createProductStock"
                          type="number"
                          step="1"
                          min="0"
                          className="form-control min-h-11"
                          value={createForm.Stock}
                          onChange={(event) =>
                            setCreateForm((previous) => ({ ...previous, Stock: event.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="createProductDescription" className="form-label">
                          Description
                        </label>
                        <textarea
                          id="createProductDescription"
                          className="form-control"
                          maxLength={255}
                          rows="3"
                          value={createForm.Description}
                          onChange={(event) =>
                            setCreateForm((previous) => ({ ...previous, Description: event.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="createProductImageUrl" className="form-label">
                          Product Image URL
                        </label>
                        <input
                          id="createProductImageUrl"
                          className="form-control min-h-11"
                          maxLength={255}
                          value={createForm.Images}
                          onChange={(event) =>
                            setCreateForm((previous) => ({ ...previous, Images: event.target.value }))
                          }
                          placeholder="https://your-project-id.supabase.co/storage/v1/object/public/product-images/..."
                          required={!createForm.ImageFile}
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="createProductImageFile" className="form-label">
                          Upload Product Image
                        </label>
                        <input
                          id="createProductImageFile"
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={(event) =>
                            setCreateForm((previous) => ({
                              ...previous,
                              ImageFile: event.target.files?.[0] || null,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                      Close
                    </button>
                    <button className="btn btn-dark" type="submit" disabled={creatingProduct}>
                      {creatingProduct ? "Creating..." : "Create Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

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
                    Update Product
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
                          className="form-select min-h-11"
                          value={selectedProductId}
                          onChange={(event) => setSelectedProductId(event.target.value)}
                        >
                          {catalog.map((product) => (
                            <option key={product.ProductID} value={product.ProductID}>
                              {product.Name} - Current Price: {product.Price}KM
                              {product.SalePrice ? ` (Sale: ${product.SalePrice}KM)` : ""} - Stock: {product.Stock ?? 0}
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
                          className="form-control min-h-11"
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
                          className="form-control min-h-11"
                          value={priceForm.SalePrice}
                          onChange={(event) =>
                            setPriceForm((previous) => ({ ...previous, SalePrice: event.target.value }))
                          }
                          placeholder="Leave empty to remove"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="adminStock" className="form-label">
                          Stock Quantity
                        </label>
                        <input
                          id="adminStock"
                          type="number"
                          step="1"
                          min="0"
                          className="form-control min-h-11"
                          value={priceForm.Stock}
                          onChange={(event) =>
                            setPriceForm((previous) => ({ ...previous, Stock: event.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="adminImageUrl" className="form-label">
                          Product Image URL
                        </label>
                        <input
                          id="adminImageUrl"
                          className="form-control min-h-11"
                          maxLength={255}
                          value={priceForm.Images}
                          onChange={(event) =>
                            setPriceForm((previous) => ({ ...previous, Images: event.target.value }))
                          }
                          placeholder="https://your-project-id.supabase.co/storage/v1/object/public/product-images/..."
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="adminImageFile" className="form-label">
                          Upload New Product Image
                        </label>
                        <input
                          id="adminImageFile"
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={(event) =>
                            setPriceForm((previous) => ({
                              ...previous,
                              ImageFile: event.target.files?.[0] || null,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                      Close
                    </button>
                    <button className="btn btn-dark" type="submit" disabled={savingProduct}>
                      {savingProduct ? "Updating..." : "Update Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
