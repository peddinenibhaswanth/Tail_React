import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <h2 className="mb-4">Welcome back, {user?.name}!</h2>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">My Orders</h5>
              <p className="text-muted">View order history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
