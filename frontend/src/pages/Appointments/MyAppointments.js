import React, { useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Table,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getMyAppointments,
  cancelAppointment,
  reset,
} from "../../redux/slices/appointmentSlice";
import Loading from "../../components/common/Loading";
import { formatDate, formatDateTime } from "../../utils/formatters";

const MyAppointments = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { appointments, isLoading, isError, message } = useSelector(
    (state) => state.appointments
  );

  useEffect(() => {
    dispatch(getMyAppointments());
    return () => dispatch(reset());
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">My Appointments</h2>
        <Button
          variant="primary"
          onClick={() => navigate("/appointments/book")}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Book New Appointment
        </Button>
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
                        {appointment.timeSlot}
                      </div>
                    </Col>

                    <Col md={3}>
                      <div className="mb-1">
                        <i className="bi bi-gear me-2"></i>
                        {appointment.service}
                      </div>
                      <div>
                        <Badge bg={getStatusVariant(appointment.status)}>
                          {appointment.status || "Pending"}
                        </Badge>
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
