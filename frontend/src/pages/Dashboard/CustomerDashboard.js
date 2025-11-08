import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUserOrders } from "../../redux/slices/orderSlice";
import useAuth from "../../hooks/useAuth";

const CustomerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { orders } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getUserOrders());
  }, [dispatch]);

  return (
    <div className="container py-4">
      <h2 className="mb-4">Welcome back, {user?.name}!</h2>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">My Orders</h5>
              <p className="display-6">{orders?.length || 0}</p>
              <Link to="/orders" className="btn btn-sm btn-primary">
                View All Orders
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">My Profile</h5>
              <p className="text-muted">Manage your account</p>
              <Link to="/profile" className="btn btn-sm btn-primary">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Browse Products</h5>
              <p className="text-muted">Shop pet supplies</p>
              <Link to="/products" className="btn btn-sm btn-primary">
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="mb-3">Recent Orders</h4>
        {orders && orders.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td>{order._id.slice(-8)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
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
        ) : (
          <p className="text-muted">No orders yet. Start shopping!</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
