import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../../redux/slices/orderSlice";

const OrderSuccess = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order, isLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    if (id) {
      dispatch(getOrder(id));
    }
  }, [dispatch, id]);

  if (isLoading || !order) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 text-center">
      <div className="card mx-auto" style={{ maxWidth: 600 }}>
        <div className="card-body">
          <div className="mb-3">
            <span className="display-4 text-success">✓</span>
          </div>
          <h3 className="card-title mb-2">Thank you for your order!</h3>
          <p className="text-muted mb-3">
            Your order has been placed successfully.
          </p>
          <p className="mb-1">
            <strong>Order ID:</strong> {order._id}
          </p>
          <p className="mb-1">
            <strong>Total Amount:</strong> ₹{order.totalAmount?.toFixed(2)}
          </p>
          <p className="mb-4">We have sent the order details to your email.</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/products" className="btn btn-outline-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
