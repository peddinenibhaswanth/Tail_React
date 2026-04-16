import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUserOrders } from "../../redux/slices/orderSlice";

const OrderList = () => {
  const dispatch = useDispatch();
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
          <div className="mb-4">
            <i className="bi bi-bag-x display-1 text-muted"></i>
          </div>
          <h3 className="mb-3">You have no orders yet</h3>
          <p className="text-muted mb-4">
            Browse our products and place your first order.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg">
            <i className="bi bi-shop me-2"></i>Shop Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">My Orders</h2>
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
                    className={`badge text-uppercase bg-${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/orders/${order._id}`}
                    className="btn btn-sm btn-outline-primary"
                    aria-label={`View order ${order._id.slice(-8)}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
