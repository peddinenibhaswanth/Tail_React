import React, { useState } from "react";
import { Container, Card, Table, Button, Form, Badge } from "react-bootstrap";
import useAuth from "../../hooks/useAuth";

const MessageManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Contact Messages</h2>
          <p className="text-muted mb-0">
            View and respond to customer inquiries
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search messages by sender name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
            <div>
              <Button variant="outline-primary" className="me-2">
                Show Unread
              </Button>
              <Button variant="outline-secondary">Mark All Read</Button>
            </div>
          </div>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  Connect to contact message API to display messages
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MessageManagement;
