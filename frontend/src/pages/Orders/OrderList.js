import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUserOrders } from "../../redux/slices/orderSlice";

const OrderList = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, isError, message } = useSelector(
    (state) => state.orders
  );

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
      <div className="container py-5 text-center">
        <h3 className="mb-3">You have no orders yet</h3>
        <p className="text-muted mb-4">
          Browse our products and place your first order.
        </p>
        <Link to="/products" className="btn btn-primary">
          Shop Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">My Orders</h2>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id.slice(-8)}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>
                  {order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0}
                </td>
                <td>₹{order.totalAmount?.toFixed(2)}</td>
                <td>
                  <span className="badge bg-secondary text-uppercase">
                    {order.status}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/orders/${order._id}`}
                    className="btn btn-sm btn-outline-primary"
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
