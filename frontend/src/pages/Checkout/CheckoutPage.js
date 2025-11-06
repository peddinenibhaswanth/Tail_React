import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getCart, clearCart } from "../../redux/slices/cartSlice";
import { createOrder } from "../../redux/slices/orderSlice";

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

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && order && order._id) {
      dispatch(clearCart());
      navigate(`/order-success/${order._id}`);
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
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city) {
      setError("Please fill all required shipping details.");
      return;
    }

    const orderData = {
      items: items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      totalAmount: total,
      shippingInfo,
      paymentMethod,
    };

    dispatch(createOrder(orderData));
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-7">
          <h2 className="mb-4">Checkout</h2>
          <form onSubmit={handleSubmit}>
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Shipping Information</h5>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Address *</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Payment Method</h5>
                <div className="form-check">
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
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="online"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="online">
                    Online Payment (coming soon)
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
              <div className="d-flex justify-content-between fw-semibold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
