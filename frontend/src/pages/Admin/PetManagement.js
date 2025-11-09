import React from "react";
import { Link } from "react-router-dom";

const PetManagement = () => {
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pet Management</h2>
        <Link to="/pets/new" className="btn btn-primary">
          Add New Pet
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search pets..."
            />
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Species</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    Connect to pet management API to display pets
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetManagement;
