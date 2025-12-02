import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  sendContactMessage,
  resetMessages,
} from "../redux/slices/messageSlice";
import useAuth from "../hooks/useAuth";
import { Link } from "react-router-dom";

const Contact = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const { isLoading, isSuccess, isError, errorMessage } = useSelector(
    (state) => state.messages
  );

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    // Reset message state when component mounts
    dispatch(resetMessages());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      // Clear form on success
      setFormData({ subject: "", message: "" });
      setErrors({});
      setValidated(false);
      // Reset success state after 5 seconds
      const timer = setTimeout(() => {
        dispatch(resetMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field when user types
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject || formData.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters";
    } else if (formData.subject.trim().length > 100) {
      newErrors.subject = "Subject must be less than 100 characters";
    }

    if (!formData.message || formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = "Message must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidated(true);

    if (!validateForm()) {
      return;
    }

    dispatch(
      sendContactMessage({
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      })
    );
  };

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-4 mb-3">Contact Us</h1>
          <p className="lead text-muted">
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </Col>
      </Row>

      <Row>
        {/* Contact Form */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h4 className="mb-4">Send us a Message</h4>

              {!isAuthenticated && (
                <Alert variant="info">
                  Please <Link to="/login">login</Link> to send us a message.
                  We'll be able to respond to you directly in your dashboard.
                </Alert>
              )}

              {isSuccess && (
                <Alert
                  variant="success"
                  dismissible
                  onClose={() => dispatch(resetMessages())}
                >
                  Thank you for your message! We'll get back to you soon. You
                  can view our reply in your{" "}
                  <Link to="/dashboard">dashboard</Link>.
                </Alert>
              )}

              {isError && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => dispatch(resetMessages())}
                >
                  {errorMessage || "An error occurred. Please try again."}
                </Alert>
              )}

              {isAuthenticated ? (
                <Form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3 p-3 bg-light rounded">
                    <small className="text-muted">Sending as:</small>
                    <div className="fw-bold">{user?.name}</div>
                    <small className="text-muted">{user?.email}</small>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Subject *</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      isInvalid={validated && !!errors.subject}
                      isValid={validated && !errors.subject && formData.subject}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.subject}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Message *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      isInvalid={validated && !!errors.message}
                      isValid={validated && !errors.message && formData.message}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.message}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      {formData.message.length}/1000 characters
                    </Form.Text>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </Form>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-envelope fs-1 text-muted d-block mb-3"></i>
                  <p className="text-muted">Login to send us a message</p>
                  <Link to="/login" className="btn btn-primary me-2">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-outline-primary">
                    Register
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Contact Information */}
        <Col lg={4} className="mt-4 mt-lg-0">
          <Card className="border-0 bg-light mb-4">
            <Card.Body className="p-4">
              <h5 className="mb-3">📍 Visit Us</h5>
              <p className="text-muted mb-0">
                123 Pet Street
                <br />
                Animal City, AC 12345
                <br />
                United States
              </p>
            </Card.Body>
          </Card>

          <Card className="border-0 bg-light mb-4">
            <Card.Body className="p-4">
              <h5 className="mb-3">📞 Call Us</h5>
              <p className="text-muted mb-2">Phone: +1 (555) 123-4567</p>
              <p className="text-muted mb-0">Mon-Fri: 9:00 AM - 6:00 PM</p>
            </Card.Body>
          </Card>

          <Card className="border-0 bg-light">
            <Card.Body className="p-4">
              <h5 className="mb-3">✉️ Email Us</h5>
              <p className="text-muted mb-0">
                support@tailwaggers.com
                <br />
                info@tailwaggers.com
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact;
