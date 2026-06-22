import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cartService } from "@/services/cartService";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";

function createCheckoutFormState(user) {
  return {
    fullName: user?.Name || "",
    address: user?.Address || "",
    email: user?.Email || "",
    phoneNumber: "",
    zipCode: "",
    town: "",
    country: "",
  };
}

function getCreditCardValidationError(cardData) {
  const expirationPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;

  if (!/^\d{16}$/.test(cardData.CardNumber)) {
    return "Card number must contain 16 digits.";
  }

  if (!expirationPattern.test(cardData.ExpirationDate)) {
    return "Expiration date must be in MM/YY format.";
  }

  const [month, year] = cardData.ExpirationDate.split("/");
  const expirationDate = new Date(Number(`20${year}`), Number(month), 0, 23, 59, 59);

  if (expirationDate.getTime() < Date.now()) {
    return "Card expiration date is invalid or expired.";
  }

  if (!/^\d{3}$/.test(cardData.Cvc)) {
    return "CVC must contain 3 digits.";
  }

  return "";
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState(() => createCheckoutFormState(user));
  const [cardData, setCardData] = useState({ CardNumber: "", ExpirationDate: "", Cvc: "" });

  useEffect(() => {
    setCheckoutForm((previous) => ({
      ...createCheckoutFormState(user),
      phoneNumber: previous.phoneNumber,
      zipCode: previous.zipCode,
      town: previous.town,
      country: previous.country,
    }));
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadCart() {
      setLoading(true);
      setError("");

      try {
        const result = await cartService.getCart();
        if (active) {
          setItems(result);
        }
      } catch (reason) {
        if (active) {
          setError(reason.message || "Failed to load checkout details");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCart();

    paymentService
      .getProviders()
      .then((providers) => {
        if (active) {
          setStripeEnabled(Boolean(providers.stripe));
        }
      })
      .catch(() => {
        if (active) {
          setStripeEnabled(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!stripeEnabled && paymentMethod === "stripe") {
      setPaymentMethod("cash");
    }
  }, [paymentMethod, stripeEnabled]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (payment === "cancelled") {
      setError("Stripe payment was cancelled.");
      setSearchParams({});
      return;
    }

    if (payment !== "success" || !sessionId) {
      return;
    }

    let active = true;
    setSubmitting(true);
    setError("");

    paymentService
      .completeStripeCheckout(sessionId)
      .then(async () => {
        if (!active) {
          return;
        }

        await refreshCartCount();
        window.alert("Stripe payment completed successfully");
        navigate("/profile", { replace: true });
      })
      .catch((reason) => {
        if (active) {
          setError(reason.message || "Failed to confirm Stripe payment");
        }
      })
      .finally(() => {
        if (active) {
          setSubmitting(false);
          setSearchParams({});
        }
      });

    return () => {
      active = false;
    };
  }, [navigate, refreshCartCount, searchParams, setSearchParams]);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = Number(item.Product?.SalePrice || item.Product?.Price || 0);
        return sum + price * Number(item.Quantity || 0);
      }, 0),
    [items],
  );

  function handleFormChange(event) {
    const { name, value } = event.target;
    setCheckoutForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setError("");

    if (paymentMethod === "credit-card") {
      const creditCardValidationError = getCreditCardValidationError(cardData);

      if (creditCardValidationError) {
        setError(creditCardValidationError);
        return;
      }
    }

    setSubmitting(true);

    try {
      if (paymentMethod === "stripe") {
        const result = await paymentService.createStripeCheckoutSession({
          successUrl: `${window.location.origin}/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/checkout?payment=cancelled`,
        });

        if (!result.checkoutUrl) {
          throw new Error("Stripe did not return a checkout URL");
        }

        window.location.href = result.checkoutUrl;
        return;
      }

      await orderService.createOrder({
        useCart: true,
        paymentMethod,
        CardNumber: paymentMethod === "credit-card" ? cardData.CardNumber : undefined,
        ExpirationDate: paymentMethod === "credit-card" ? cardData.ExpirationDate : undefined,
        Cvc: paymentMethod === "credit-card" ? cardData.Cvc : undefined,
      });
      await refreshCartCount();
      window.alert("Order placed successfully");
      navigate("/profile", { replace: true });
    } catch (reason) {
      setError(reason.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading checkout..." />;
  }

  if (!items.length) {
    return (
      <div className="container py-5">
        <EmptyState title="Your cart is empty" description="Add products before checkout." />
      </div>
    );
  }

  return (
    <div className="container py-5 px-3 sm:px-4">
      {error ? <div className="alert alert-danger mb-4">{error}</div> : null}
      <form onSubmit={handleCheckout}>
        <div className="row g-4 align-items-start">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm checkout-section-card rounded-lg">
              <div className="card-body p-4 p-xl-5">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                  <div>
                    <h2 className="h4 fw-bolder mb-1 text-2xl">Checkout</h2>
                    <p className="text-muted mb-0">
                      Enter your delivery information before placing the order.
                    </p>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="checkout-full-name" className="form-label fw-semibold">
                      Full Name
                    </label>
                    <input
                      id="checkout-full-name"
                      name="fullName"
                      className="form-control min-h-11"
                      value={checkoutForm.fullName}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="checkout-address" className="form-label fw-semibold">
                      Address
                    </label>
                    <input
                      id="checkout-address"
                      name="address"
                      className="form-control min-h-11"
                      value={checkoutForm.address}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="checkout-email" className="form-label fw-semibold">
                      Email
                    </label>
                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      className="form-control min-h-11"
                      value={checkoutForm.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="checkout-phone-number" className="form-label fw-semibold">
                      Number
                    </label>
                    <input
                      id="checkout-phone-number"
                      name="phoneNumber"
                      type="tel"
                      className="form-control min-h-11"
                      value={checkoutForm.phoneNumber}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="checkout-zip-code" className="form-label fw-semibold">
                      Zipcode
                    </label>
                    <input
                      id="checkout-zip-code"
                      name="zipCode"
                      className="form-control min-h-11"
                      value={checkoutForm.zipCode}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="checkout-town" className="form-label fw-semibold">
                      Town
                    </label>
                    <input
                      id="checkout-town"
                      name="town"
                      className="form-control min-h-11"
                      value={checkoutForm.town}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="checkout-country" className="form-label fw-semibold">
                      Country
                    </label>
                    <input
                      id="checkout-country"
                      name="country"
                      className="form-control min-h-11"
                      value={checkoutForm.country}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="checkout-sidebar d-grid gap-4">
              <div className="card border-0 shadow-sm checkout-section-card rounded-lg">
                <div className="card-body p-4">
                  <h3 className="h5 fw-bolder mb-4">Payment Selection</h3>
                  <div className="checkout-payment-option">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="payment-cash"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                    <label className="form-check-label" htmlFor="payment-cash">
                      Cash
                    </label>
                  </div>
                  {stripeEnabled ? (
                    <div className="checkout-payment-option">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="payment-stripe"
                        value="stripe"
                        checked={paymentMethod === "stripe"}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                      />
                      <label className="form-check-label" htmlFor="payment-stripe">
                        Stripe Checkout
                      </label>
                    </div>
                  ) : null}
                  <div className="checkout-payment-option">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="payment-credit-card"
                      value="credit-card"
                      checked={paymentMethod === "credit-card"}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                    <label className="form-check-label" htmlFor="payment-credit-card">
                      Credit Card
                    </label>
                  </div>

                  {paymentMethod === "credit-card" ? (
                    <div className="row g-3 mt-1">
                      <div className="col-12">
                        <label htmlFor="checkout-card-number" className="form-label fw-semibold">
                          Card Number
                        </label>
                        <input
                          id="checkout-card-number"
                          className="form-control min-h-11"
                          placeholder="1234123412341234"
                          maxLength={16}
                          value={cardData.CardNumber}
                          onChange={(event) =>
                            setCardData((previous) => ({
                              ...previous,
                              CardNumber: event.target.value.replace(/\D/g, "").slice(0, 16),
                            }))
                          }
                          required={paymentMethod === "credit-card"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="checkout-expiration-date" className="form-label fw-semibold">
                          Expiration Date
                        </label>
                        <input
                          id="checkout-expiration-date"
                          className="form-control min-h-11"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardData.ExpirationDate}
                          onChange={(event) =>
                            setCardData((previous) => ({
                              ...previous,
                              ExpirationDate: event.target.value,
                            }))
                          }
                          required={paymentMethod === "credit-card"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="checkout-cvc" className="form-label fw-semibold">
                          CVC
                        </label>
                        <input
                          id="checkout-cvc"
                          className="form-control min-h-11"
                          placeholder="123"
                          maxLength={3}
                          value={cardData.Cvc}
                          onChange={(event) =>
                            setCardData((previous) => ({
                              ...previous,
                              Cvc: event.target.value.replace(/\D/g, "").slice(0, 3),
                            }))
                          }
                          required={paymentMethod === "credit-card"}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="card border-0 shadow-sm checkout-section-card rounded-lg">
                <div className="card-body p-4">
                  <h3 className="h5 fw-bolder mb-4">Order Total</h3>
                  <div className="checkout-items-list mb-4">
                    {items.map((item) => {
                      const price = Number(item.Product?.SalePrice || item.Product?.Price || 0);
                      return (
                        <div className="checkout-item" key={item.CartID}>
                          <div>
                            <div className="fw-semibold">{item.Product?.Name}</div>
                            <div className="text-muted small">Qty: {item.Quantity}</div>
                          </div>
                          <div className="fw-semibold">
                            {(price * Number(item.Quantity || 0)).toFixed(2)} KM
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="checkout-summary-total">
                    <span>Total Amount</span>
                    <span>{total.toFixed(2)} KM</span>
                  </div>
                  <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                    <button type="button" className="btn btn-outline-dark min-h-11" onClick={() => navigate("/cart")}>
                      Back to Cart
                    </button>
                    <button type="submit" className="btn btn-dark min-h-11" disabled={submitting}>
                      {submitting ? "Processing..." : paymentMethod === "stripe" ? "Pay with Stripe" : "Place Order"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
