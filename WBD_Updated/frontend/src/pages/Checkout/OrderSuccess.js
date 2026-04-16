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
    <div className="container py-5 text-center" style={{ minHeight: '70vh' }} >
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 600 }}>
        <div className="card-body p-5">
          <div className="mb-3">
            <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-check-lg text-success" style={{ fontSize: '2.5rem' }}></i>
            </div>
          </div>
          <h3 className="card-title fw-bold mb-2">Thank you for your order! 🎉</h3>
          <p className="text-muted mb-4">
            Your order has been placed successfully.
          </p>
          <div className="bg-light rounded-3 p-3 mb-4 text-start">
            <p className="mb-1">
              <strong>Order #:</strong>{" "}
              {order.orderNumber || order._id?.slice(-8)}
            </p>
            <p className="mb-1">
              <strong>Total Amount:</strong> ₹{(order.total || 0).toFixed(2)}
            </p>
            <p className="mb-0">
              <strong>Status:</strong>{" "}
              <span className="badge bg-warning text-uppercase rounded-pill">
                {order.status}
              </span>
            </p>
          </div>
          <p className="mb-4 text-muted small">We have sent the order details to your email.</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/orders" className="btn btn-primary rounded-pill px-4">
              <i className="bi bi-bag me-1"></i>View My Orders
            </Link>
            <Link to="/products" className="btn btn-outline-primary rounded-pill px-4">
              <i className="bi bi-arrow-right me-1"></i>Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
