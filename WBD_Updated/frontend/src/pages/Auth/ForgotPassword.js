import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { isValidEmail } from "../../utils/validation";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    if (!email || !email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // TODO: Implement password reset API call
      // await passwordResetService.sendResetEmail(email);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--neutral-50)', minHeight: '80vh' }} className="d-flex align-items-center">
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="auth-card shadow-sm border-0">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="feature-icon mx-auto mb-3">
                  <i className="bi bi-key-fill fs-4"></i>
                </div>
                <h2 className="fw-bold">Forgot Password?</h2>
                <p className="text-muted small">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success">
                  Password reset link has been sent to your email. Please check
                  your inbox.
                </Alert>
              )}

              {!success && (
                <Form onSubmit={onSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your registered email"
                      isInvalid={validated && !!error}
                      isValid={
                        validated && !error && email && isValidEmail(email)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      {error}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 mb-3 rounded-pill py-2 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <div className="text-center">
                    <Link to="/login" className="text-decoration-none">
                      ← Back to Login
                    </Link>
                  </div>
                </Form>
              )}

              {success && (
                <div className="text-center mt-3">
                  <Link to="/login" className="btn btn-outline-primary rounded-pill px-4">
                    Return to Login
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default ForgotPassword;
