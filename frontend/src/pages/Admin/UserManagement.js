import React, { useState } from "react";
import { Container, Card, Table, Button, Form, Badge } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";

const UserManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">User Management</h2>
          <p className="text-muted mb-0">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
            <div>
              <Button variant="outline-primary" className="me-2">
                Filter by Role
              </Button>
              <Button variant="primary">Add User</Button>
            </div>
          </div>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  Connect to user management API to display users
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserManagement;
