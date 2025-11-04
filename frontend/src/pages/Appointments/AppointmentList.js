import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  Table,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllAppointments,
  updateAppointmentStatus,
  reset,
} from "../../redux/slices/appointmentSlice";
import Loading from "../../components/common/Loading";
import { formatDate } from "../../utils/formatters";

const AppointmentList = () => {
  const dispatch = useDispatch();
  const { appointments, isLoading, isError, message } = useSelector(
    (state) => state.appointments
  );

  const [filter, setFilter] = useState({
    status: "",
    date: "",
    service: "",
  });

  useEffect(() => {
    dispatch(getAllAppointments(filter));
    return () => dispatch(reset());
  }, [dispatch, filter]);

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

  const handleStatusChange = (appointmentId, newStatus) => {
    dispatch(updateAppointmentStatus({ id: appointmentId, status: newStatus }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilter({ status: "", date: "", service: "" });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">All Appointments</h2>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={filter.date}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Service</Form.Label>
                <Form.Select
                  name="service"
                  value={filter.service}
                  onChange={handleFilterChange}
                >
                  <option value="">All Services</option>
                  <option value="General Checkup">General Checkup</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Grooming">Grooming</option>
                  <option value="Dental Care">Dental Care</option>
                  <option value="Surgery Consultation">
                    Surgery Consultation
                  </option>
                  <option value="Emergency Care">Emergency Care</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3} className="d-flex align-items-end">
              <Button variant="secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isError && (
        <div className="alert alert-danger" role="alert">
          {message}
        </div>
      )}

      {/* Appointments Table */}
      {appointments && appointments.length > 0 ? (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Pet Name</th>
                  <th>Owner</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>
                      <div className="fw-semibold">{appointment.petName}</div>
                      <small className="text-muted">
                        {appointment.petType}
                      </small>
                    </td>
                    <td>
                      <div>{appointment.userId?.name || "N/A"}</div>
                      <small className="text-muted">
                        {appointment.userId?.email || ""}
                      </small>
                    </td>
                    <td>{appointment.service}</td>
                    <td>
                      <div>{formatDate(appointment.date)}</div>
                      <small className="text-muted">
                        {appointment.timeSlot}
                      </small>
                    </td>
                    <td>
                      <Badge bg={getStatusVariant(appointment.status)}>
                        {appointment.status || "Pending"}
                      </Badge>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={appointment.status || "pending"}
                        onChange={(e) =>
                          handleStatusChange(appointment._id, e.target.value)
                        }
                        style={{ width: "150px" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </Form.Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
            <h4>No Appointments Found</h4>
            <p className="text-muted">
              {filter.status || filter.date || filter.service
                ? "Try adjusting your filters"
                : "No appointments have been scheduled yet"}
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AppointmentList;
