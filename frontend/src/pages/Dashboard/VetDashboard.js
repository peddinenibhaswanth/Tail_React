import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const VetDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <h2 className="mb-4">Veterinary Dashboard - Dr. {user?.name}</h2>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Today's Appointments</h5>
              <p className="display-6">--</p>
              <small className="text-muted">Scheduled for today</small>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Pending Appointments</h5>
              <p className="display-6">--</p>
              <small className="text-muted">Awaiting confirmation</small>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Total Appointments</h5>
              <p className="display-6">--</p>
              <small className="text-muted">This month</small>
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
                <Link to="/admin/appointments" className="btn btn-primary">
                  View All Appointments
                </Link>
                <Link to="/appointments" className="btn btn-outline-primary">
                  My Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Upcoming Appointments</h5>
              <p className="text-muted">
                Connect vet appointments API to display upcoming schedule and
                patient details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetDashboard;
