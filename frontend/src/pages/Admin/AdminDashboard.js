import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <h2 className="mb-4">Admin Dashboard - {user?.name}</h2>

      <div className="row g-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Users</h5>
              <p className="display-6">--</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Pets</h5>
              <p className="display-6">--</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Products</h5>
              <p className="display-6">--</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Orders</h5>
              <p className="display-6">--</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <h4 className="mb-3">Quick Management</h4>
        </div>
        <div className="col-md-6">
          <div className="list-group">
            <Link
              to="/admin/users"
              className="list-group-item list-group-item-action"
            >
              <i className="bi bi-people me-2"></i> Manage Users
            </Link>
            <Link
              to="/admin/pets"
              className="list-group-item list-group-item-action"
            >
              <i className="bi bi-heart me-2"></i> Manage Pets
            </Link>
            <Link
              to="/admin/products"
              className="list-group-item list-group-item-action"
            >
              <i className="bi bi-box me-2"></i> Manage Products
            </Link>
          </div>
        </div>
        <div className="col-md-6">
          <div className="list-group">
            <Link
              to="/admin/orders"
              className="list-group-item list-group-item-action"
            >
              <i className="bi bi-cart me-2"></i> Manage Orders
            </Link>
            <Link
              to="/admin/applications"
              className="list-group-item list-group-item-action"
            >
              <i className="bi bi-file-text me-2"></i> Manage Applications
            </Link>
            <Link
              to="/admin/appointments"
              className="list-group-item list-group-item-action"
            >
              <i className="bi bi-calendar me-2"></i> Manage Appointments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
