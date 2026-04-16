import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getUserOrders } from "../../redux/slices/orderSlice";

const OrderList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, isLoading, isError, message } = useSelector(
    (state) => state.orders
  );

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return statusColors[status] || "secondary";
  };

  useEffect(() => {
    dispatch(getUserOrders());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {message || "Failed to load orders."}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div className="mb-4" style={{ fontSize: '4rem' }}>
            📦
          </div>
          <h3 className="mb-3">You have no orders yet</h3>
          <p className="text-muted mb-4">
            Browse our products and place your first order.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg rounded-pill">
            <i className="bi bi-shop me-2"></i>Shop Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h2 className="mb-0"><i className="bi bi-bag-check me-2"></i>My Orders</h2>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate("/dashboard")}
        >
          <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
        </button>
      </div>
      <p className="text-muted mb-4">Track and manage your purchases</p>
      <div className="card border-0 shadow-sm">
      <div className="card-body p-0">
      <div className="table-responsive">
        <table
          className="table table-hover align-middle"
          aria-label="Order history table"
        >
          <thead className="table-light">
            <tr>
              <th scope="col">Order ID</th>
              <th scope="col">Date</th>
              <th scope="col">Items</th>
              <th scope="col">Total</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  <code className="small">#{order._id.slice(-8)}</code>
                </td>
                <td className="text-nowrap">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <span className="badge bg-light text-dark">
                    {order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0}{" "}
                    item(s)
                  </span>
                </td>
                <td className="fw-semibold">
                  ₹{(order.total || 0).toFixed(2)}
                </td>
                <td>
                  <span
                    className={`badge rounded-pill text-uppercase bg-${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Link
                      to={`/orders/${order._id}`}
                      className="btn btn-sm btn-outline-primary rounded-pill"
                      aria-label={`View order ${order._id.slice(-8)}`}
                    >
                      View
                    </Link>
                    {order.status === "delivered" && (
                      <Link
                        to={`/orders/${order._id}?action=review`}
                        className="btn btn-sm btn-outline-warning rounded-pill"
                        aria-label={`Review items from order ${order._id.slice(-8)}`}
                      >
                        <i className="bi bi-star me-1"></i>Review
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </div>
    </div>
  );
};

export default OrderList;
