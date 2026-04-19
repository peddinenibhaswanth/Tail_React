import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getCart, clearCart } from "../../redux/slices/cartSlice";
import { createOrder, resetOrders, clearOrder } from "../../redux/slices/orderSlice";

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    items,
    total,
    isLoading: cartLoading,
  } = useSelector((state) => state.cart);
  const {
    isLoading: orderLoading,
    order,
    isSuccess,
    isError: orderError,
    message: orderMessage,
  } = useSelector((state) => state.orders);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [validated, setValidated] = useState(false);
  // Track whether the order was created within this component's lifetime
  // This prevents stale Redux state from triggering navigation on mount
  const orderCreatedHere = useRef(false);

  useEffect(() => {
    // Reset any stale order state when component mounts
    dispatch(resetOrders());
    dispatch(clearOrder());
    dispatch(getCart());
  }, [dispatch]);

  // Show backend order error (e.g. insufficient stock) in the form
  useEffect(() => {
    if (orderError && orderMessage) {
      setError(orderMessage);
      orderCreatedHere.current = false;
    }
  }, [orderError, orderMessage]);

  useEffect(() => {
    // Only navigate if the order was created during this checkout session
    if (orderCreatedHere.current && isSuccess && order && order._id) {
      orderCreatedHere.current = false;
      dispatch(clearCart());
      navigate(`/order-success/${order._id}`);
      dispatch(resetOrders());
    }
  }, [isSuccess, order, navigate, dispatch]);

  if (!items || items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h3 className="mb-3">No items to checkout</h3>
      </div>
    );
  }

  const stockIssues = items.filter(
    (item) => item.product && item.quantity > item.product.stock
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setError("");
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (
      !shippingAddress.fullName ||
      shippingAddress.fullName.trim().length < 2
    ) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Phone validation (10 digits)
    if (!shippingAddress.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(shippingAddress.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    // Address validation
    if (!shippingAddress.street || shippingAddress.street.trim().length < 10) {
      newErrors.street =
        "Please enter a complete address (at least 10 characters)";
    }

    // City validation
    if (!shippingAddress.city || shippingAddress.city.trim().length < 2) {
      newErrors.city = "City is required";
    }

    // State validation
    if (!shippingAddress.state || shippingAddress.state.trim().length < 2) {
      newErrors.state = "State is required";
    }

    // ZIP code validation (6 digits for India)
    if (!shippingAddress.zipCode) {
      newErrors.zipCode = "PIN code is required";
    } else if (!/^\d{6}$/.test(shippingAddress.zipCode)) {
      newErrors.zipCode = "Please enter a valid 6-digit PIN code";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setValidated(true);

    if (!validateForm()) {
      setError("Please fix the errors in the form before submitting.");
      return;
    }

    const orderData = {
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        zipCode: shippingAddress.zipCode.trim(),
        country: shippingAddress.country || "India",
      },
      paymentMethod,
    };

    orderCreatedHere.current = true;
    dispatch(createOrder(orderData));
  };

  if (stockIssues.length > 0) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger mb-4">
          <h5 className="mb-2"><i className="bi bi-exclamation-triangle me-2"></i>Stock Issue</h5>
          <p className="mb-1">The following items in your cart exceed available stock:</p>
          <ul className="list-unstyled mb-2">
            {stockIssues.map((item) => (
              <li key={item._id}>
                <strong>{item.product.name}</strong>: you have {item.quantity}, only {item.product.stock} available
              </li>
            ))}
          </ul>
          <p className="mb-0 small">Please update your cart before checking out.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary rounded-pill px-4"
          onClick={() => navigate("/cart")}
        >
          <i className="bi bi-cart3 me-1"></i>Go Back to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-7">
          <div className="mb-4">
            <h2 className="fw-bold mb-1"><i className="bi bi-credit-card me-2 text-primary"></i>Checkout</h2>
            <p className="text-muted mb-0 small">Complete your order details below</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3"><i className="bi bi-truck me-2 text-primary"></i>Shipping Information</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="fullName" className="form-label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        validated
                          ? fieldErrors.fullName
                            ? "is-invalid"
                            : shippingAddress.fullName
                            ? "is-valid"
                            : ""
                          : ""
                      }`}
                      id="fullName"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                    />
                    {fieldErrors.fullName && (
                      <div className="invalid-feedback">
                        {fieldErrors.fullName}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${
                        validated
                          ? fieldErrors.phone
                            ? "is-invalid"
                            : shippingAddress.phone
                            ? "is-valid"
                            : ""
                          : ""
                      }`}
                      id="phone"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength="10"
                    />
                    {fieldErrors.phone && (
                      <div className="invalid-feedback">
                        {fieldErrors.phone}
                      </div>
                    )}
                  </div>
                  <div className="col-md-12">
                    <label htmlFor="street" className="form-label">
                      Complete Address *
                    </label>
                    <textarea
                      className={`form-control ${
                        validated
                          ? fieldErrors.street
                            ? "is-invalid"
                            : shippingAddress.street
                            ? "is-valid"
                            : ""
                          : ""
                      }`}
                      id="street"
                      rows="3"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleChange}
                      placeholder="House No., Street Name, Area, Landmark"
                    />
                    {fieldErrors.street && (
                      <div className="invalid-feedback">
                        {fieldErrors.street}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="city" className="form-label">
                      City *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        validated
                          ? fieldErrors.city
                            ? "is-invalid"
                            : shippingAddress.city
                            ? "is-valid"
                            : ""
                          : ""
                      }`}
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                    />
                    {fieldErrors.city && (
                      <div className="invalid-feedback">{fieldErrors.city}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        validated
                          ? fieldErrors.state
                            ? "is-invalid"
                            : shippingAddress.state
                            ? "is-valid"
                            : ""
                          : ""
                      }`}
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                    />
                    {fieldErrors.state && (
                      <div className="invalid-feedback">
                        {fieldErrors.state}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">PIN Code *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        validated
                          ? fieldErrors.zipCode
                            ? "is-invalid"
                            : shippingAddress.zipCode
                            ? "is-valid"
                            : ""
                          : ""
                      }`}
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleChange}
                      placeholder="400001"
                      maxLength="6"
                    />
                    {fieldErrors.zipCode && (
                      <div className="invalid-feedback">
                        {fieldErrors.zipCode}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleChange}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3"><i className="bi bi-wallet2 me-2 text-primary"></i>Payment Method</h5>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="cod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="cod">
                    Cash on Delivery (COD)
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="card"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="card">
                    Credit/Debit Card (Coming Soon)
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="upi"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="upi">
                    UPI (Coming Soon)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="netbanking"
                    value="netbanking"
                    checked={paymentMethod === "netbanking"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="netbanking">
                    Net Banking (Coming Soon)
                  </label>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-danger mb-3">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary rounded-pill px-4 py-2 fw-semibold"
              disabled={cartLoading || orderLoading || stockIssues.length > 0}
            >
              {orderLoading ? "Placing Order..." : (<><i className="bi bi-check-circle me-1"></i>Place Order</>)}
            </button>
          </form>
        </div>

        <div className="col-lg-5 mt-4 mt-lg-0">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-3"><i className="bi bi-receipt me-2 text-primary"></i>Order Summary</h5>
              {items.map((item) => (
                <div
                  key={item._id}
                  className="d-flex justify-content-between mb-2"
                >
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <hr />
              {/* Pricing Breakdown */}
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax (18% GST)</span>
                <span>₹{(total * 0.18).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span>{total > 1000 ? "Free" : "₹50.00"}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5">
                <span>Total Amount</span>
                <span>₹{(total + (total * 0.18) + (total > 1000 ? 0 : 50)).toFixed(2)}</span>
              </div>
              <small className="text-muted d-block mt-2">
                {total > 1000 ? "🎉 You qualify for free shipping!" : `Add ₹${(1001 - total).toFixed(0)} more for free shipping`}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
