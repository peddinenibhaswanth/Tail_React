import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  getAppointment,
  cancelAppointment,
  resetAppointments,
} from "../../redux/slices/appointmentSlice";

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { appointment, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.appointments
  );

  useEffect(() => {
    dispatch(getAppointment(id));

    return () => {
      dispatch(resetAppointments());
    };
  }, [dispatch, id]);

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: "info",
      confirmed: "primary",
      completed: "success",
      cancelled: "danger",
      "no-show": "warning",
    };
    return statusColors[status] || "secondary";
  };

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      await dispatch(cancelAppointment(id));
      navigate("/appointments");
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading appointment details...</p>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{message || "Failed to load appointment details"}</p>
          <Button variant="outline-danger" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Appointment Not Found</Alert.Heading>
          <p>The appointment you're looking for doesn't exist.</p>
          <Button variant="outline-warning" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Appointment Details</h2>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </Button>
      </div>

      {isSuccess && message && (
        <Alert variant="success" dismissible>
          {message}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  Appointment Information
                </h5>
                <Badge bg={getStatusBadge(appointment.status)} className="fs-6">
                  {appointment.status?.toUpperCase()}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="text-muted mb-1">Date</p>
                  <p className="fw-bold">
                    {new Date(appointment.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </Col>
                <Col md={6}>
                  <p className="text-muted mb-1">Time</p>
                  <p className="fw-bold">
                    {appointment.timeSlot?.start || appointment.time || "N/A"}
                    {appointment.timeSlot?.end &&
                      ` - ${appointment.timeSlot.end}`}
                  </p>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <p className="text-muted mb-1">Pet Name</p>
                  <p className="fw-bold">
                    {appointment.petName || appointment.pet?.name || "N/A"}
                  </p>
                </Col>
                <Col md={6}>
                  <p className="text-muted mb-1">Pet Type</p>
                  <p className="fw-bold">
                    {appointment.petType || appointment.pet?.species || "N/A"}
                  </p>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={12}>
                  <p className="text-muted mb-1">Reason for Visit</p>
                  <p className="fw-bold">
                    {appointment.reason || "General checkup"}
                  </p>
                </Col>
              </Row>

              {appointment.notes && (
                <Row className="mb-3">
                  <Col md={12}>
                    <p className="text-muted mb-1">Additional Notes</p>
                    <p>{appointment.notes}</p>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Veterinarian Info */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-person-badge me-2"></i>
                Veterinarian
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                  style={{ width: "60px", height: "60px", fontSize: "24px" }}
                >
                  {appointment.veterinary?.name?.charAt(0) || "V"}
                </div>
                <div>
                  <h5 className="mb-1">
                    Dr. {appointment.veterinary?.name || "N/A"}
                  </h5>
                  <p className="text-muted mb-0">
                    {appointment.veterinary?.email || ""}
                  </p>
                  {appointment.veterinary?.phone && (
                    <p className="text-muted mb-0">
                      <i className="bi bi-telephone me-1"></i>
                      {appointment.veterinary.phone}
                    </p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Actions Card */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              {/* Customer can cancel scheduled appointments */}
              {appointment.status === "scheduled" && (
                <Button
                  variant="danger"
                  className="w-100 mb-2"
                  onClick={handleCancel}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel Appointment
                </Button>
              )}

              {appointment.status === "confirmed" && (
                <Alert variant="info" className="mb-0">
                  <i className="bi bi-check-circle me-2"></i>
                  Your appointment is confirmed.
                </Alert>
              )}

              {appointment.status === "completed" && (
                <Alert variant="success" className="mb-0">
                  <i className="bi bi-check-circle me-2"></i>
                  This appointment has been completed.
                </Alert>
              )}

              {appointment.status === "cancelled" && (
                <Alert variant="danger" className="mb-0">
                  <i className="bi bi-x-circle me-2"></i>
                  This appointment has been cancelled.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AppointmentDetail;
