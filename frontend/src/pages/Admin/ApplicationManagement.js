import React, { useState } from "react";
import { Container, Card, Table, Button, Form, Badge } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";

const ApplicationManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Adoption Applications</h2>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search applications by applicant name or pet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
            <Button variant="outline-primary">Filter by Status</Button>
          </div>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Applicant</th>
                <th>Pet Name</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  Connect to adoption application API to display applications
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ApplicationManagement;
