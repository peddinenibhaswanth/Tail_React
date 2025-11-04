import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

const AppointmentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentData = location.state?.appointment;

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={6}>
          <Card className="shadow-sm text-center">
            <Card.Body className="p-5">
              <div className="mb-4">
                <div
                  className="rounded-circle bg-success d-inline-flex align-items-center justify-content-center"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i
                    className="bi bi-check-lg text-white"
                    style={{ fontSize: "40px" }}
                  ></i>
                </div>
              </div>

              <h2 className="fw-bold mb-3">Appointment Confirmed!</h2>

              <p className="text-muted mb-4">
                Your appointment has been successfully booked. You will receive
                a confirmation email shortly.
              </p>

              {appointmentData && (
                <Card className="bg-light border-0 mb-4">
                  <Card.Body>
                    <Row className="text-start">
                      <Col xs={6} className="mb-3">
                        <small className="text-muted">Pet Name</small>
                        <div className="fw-semibold">
                          {appointmentData.petName}
                        </div>
                      </Col>
                      <Col xs={6} className="mb-3">
                        <small className="text-muted">Pet Type</small>
                        <div className="fw-semibold">
                          {appointmentData.petType}
                        </div>
                      </Col>
                      <Col xs={6} className="mb-3">
                        <small className="text-muted">Service</small>
                        <div className="fw-semibold">
                          {appointmentData.service}
                        </div>
                      </Col>
                      <Col xs={6} className="mb-3">
                        <small className="text-muted">Date</small>
                        <div className="fw-semibold">
                          {appointmentData.date}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <small className="text-muted">Time Slot</small>
                        <div className="fw-semibold">
                          {appointmentData.timeSlot}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                Please arrive 10 minutes before your scheduled time
              </div>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/appointments/my")}
                >
                  View My Appointments
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AppointmentConfirmation;
