import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const SellerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <h2 className="mb-4">Seller Dashboard - {user?.name}</h2>

      <div className="row g-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Total Products</h5>
              <p className="display-6">--</p>
              <small className="text-muted">Products listed</small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Orders</h5>
              <p className="display-6">--</p>
              <small className="text-muted">Total orders</small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Revenue</h5>
              <p className="display-6">₹--</p>
              <small className="text-muted">Total earnings</small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Pending</h5>
              <p className="display-6">--</p>
              <small className="text-muted">Pending orders</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4 g-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <div className="d-grid gap-2">
                <Link to="/admin/products" className="btn btn-primary">
                  Manage Products
                </Link>
                <Link to="/admin/orders" className="btn btn-outline-primary">
                  View Orders
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Activity</h5>
              <p className="text-muted">
                Connect seller analytics API to display recent orders and
                product performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
