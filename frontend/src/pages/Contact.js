import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to backend API to send message
    setSubmitStatus("success");
    setFormData({ name: "", email: "", subject: "", message: "" });

    // Clear success message after 5 seconds
    setTimeout(() => setSubmitStatus(null), 5000);
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

              {submitStatus === "success" && (
                <Alert
                  variant="success"
                  onClose={() => setSubmitStatus(null)}
                  dismissible
                >
                  Thank you for your message! We'll get back to you soon.
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is this regarding?"
                    required
                  />
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
                    required
                  />
                </Form.Group>

                <Button type="submit" variant="primary" size="lg">
                  Send Message
                </Button>
              </Form>
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
