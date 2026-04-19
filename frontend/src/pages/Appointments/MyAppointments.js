import React, { useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserAppointments,
  cancelAppointment,
} from "../../redux/slices/appointmentSlice";
import Loading from "../../components/common/Loading";
import { formatDate } from "../../utils/formatters";

const MyAppointments = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { appointments, isLoading, isError, message } = useSelector(
    (state) => state.appointments
  );

  useEffect(() => {
    dispatch(getUserAppointments());
  }, [dispatch]);

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "completed":
        return "info";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  const handleCancel = (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      dispatch(cancelAppointment(id));
    }
  };

  const canCancel = (appointment) => {
    const status = appointment.status?.toLowerCase();
    return status === "pending" || status === "confirmed";
  };

  if (isLoading && !appointments?.length) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Appointments</h2>
          <p className="text-muted mb-0 small">Track all your scheduled visits</p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/appointments/book")}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Book New Appointment
          </Button>
        </div>
      </div>

      {isError && (
        <div className="alert alert-danger" role="alert">
          {message}
        </div>
      )}

      {appointments && appointments.length > 0 ? (
        <Row>
          {appointments.map((appointment) => (
            <Col key={appointment._id} lg={12} className="mb-3">
              <Card className="shadow-sm">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={3}>
                      <h5 className="mb-1">{appointment.petName}</h5>
                      <p className="text-muted mb-0">{appointment.petType}</p>
                    </Col>

                    <Col md={3}>
                      <div className="mb-1">
                        <i className="bi bi-calendar3 me-2"></i>
                        <strong>{formatDate(appointment.date)}</strong>
                      </div>
                      <div className="text-muted">
                        <i className="bi bi-clock me-2"></i>
                        {appointment.timeSlot?.start
                          ? `${appointment.timeSlot.start} - ${appointment.timeSlot.end}`
                          : appointment.timeSlot || "N/A"}
                      </div>
                    </Col>

                    <Col md={3}>
                      <div className="mb-1">
                        <i className="bi bi-stethoscope me-2"></i>
                        Dr. {appointment.veterinary?.name || "N/A"}
                      </div>
                      <div className="mb-1">
                        <i className="bi bi-gear me-2"></i>
                        {appointment.reason ||
                          appointment.service ||
                          "General Checkup"}
                      </div>
                      <div>
                        <Badge bg={getStatusVariant(appointment.status)}>
                          {appointment.status || "Pending"}
                        </Badge>
                        {appointment.status === "cancelled" && appointment.cancelledByRole && (
                          <div className="mt-1">
                            <small className="text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              {appointment.cancelledByRole === "customer"
                                ? "You cancelled"
                                : appointment.cancelledByRole === "veterinary"
                                  ? "Cancelled by veterinarian"
                                  : `Cancelled by ${appointment.cancelledByRole}`}
                            </small>
                          </div>
                        )}
                      </div>
                    </Col>

                    <Col md={3} className="text-end">
                      <Link
                        to={`/appointments/${appointment._id}`}
                        className="btn btn-outline-primary btn-sm me-2"
                      >
                        View Details
                      </Link>
                      {canCancel(appointment) && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleCancel(appointment._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </Col>
                  </Row>

                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted">
                        <strong>Notes:</strong> {appointment.notes}
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
            <h4>No Appointments Found</h4>
            <p className="text-muted mb-4">
              You haven't booked any appointments yet.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/appointments/book")}
            >
              Book Your First Appointment
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default MyAppointments;
