import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    // Reset order state when component mounts to allow new orders
    dispatch(resetOrders());
    dispatch(clearOrder());
    dispatch(getCart());
  }, [dispatch]);

  useEffect(() => {
    // Only navigate if we just successfully created a new order
    // Check both isSuccess flag and that order exists with an ID
    if (isSuccess && order && order._id) {
      // Clear cart and navigate to success page
      dispatch(clearCart());
      navigate(`/order-success/${order._id}`);
      // Reset the success flag after navigation to prevent re-navigation
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

    dispatch(createOrder(orderData));
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-7">
          <h2 className="mb-4">Checkout</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Shipping Information</h5>
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

            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Payment Method</h5>
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
              className="btn btn-primary"
              disabled={cartLoading || orderLoading}
            >
              {orderLoading ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </div>

        <div className="col-lg-5 mt-4 mt-lg-0">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Order Summary</h5>
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
