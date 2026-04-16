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
  Modal,
  Alert,
} from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserAppointments,
  getVetAppointments,
  updateAppointmentStatus,
  resetAppointments,
} from "../../redux/slices/appointmentSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";
import { formatDate } from "../../utils/formatters";

const AppointmentList = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useAuth();
  const { appointments, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.appointments
  );

  const [filter, setFilter] = useState({
    status: "",
    date: "",
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [notes, setNotes] = useState("");

  // Determine if this is vet view
  const isVetView =
    location.pathname.includes("/vet/") ||
    (user?.role === "veterinary" &&
      !location.pathname.includes("/my-appointments"));
  const isAdminView = location.pathname.includes("/admin/");

  useEffect(() => {
    if (isVetView || user?.role === "veterinary") {
      dispatch(getVetAppointments(filter));
    } else {
      dispatch(getUserAppointments());
    }
    return () => dispatch(resetAppointments());
  }, [dispatch, isVetView, user?.role]);

  useEffect(() => {
    if (isSuccess && message?.includes("updated")) {
      // Refresh appointments after status update
      if (isVetView || user?.role === "veterinary") {
        dispatch(getVetAppointments(filter));
      } else {
        dispatch(getUserAppointments());
      }
    }
  }, [isSuccess, message, dispatch, isVetView, user?.role, filter]);

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "primary";
      case "pending":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      case "in-progress":
        return "info";
      case "no-show":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const handleStatusUpdate = (appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status || "pending");
    setNewPaymentStatus(appointment.paymentStatus || "pending");
    setNotes(appointment.notes || "");
    setShowStatusModal(true);
  };

  const submitStatusUpdate = () => {
    if (selectedAppointment && newStatus) {
      dispatch(
        updateAppointmentStatus({
          id: selectedAppointment._id,
          status: newStatus,
          notes: notes,
          paymentStatus: newPaymentStatus,
        })
      );
      setShowStatusModal(false);
      setSelectedAppointment(null);
      setNotes("");
      setNewPaymentStatus("");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilter({ status: "", date: "" });
  };

  // Filter appointments locally
  const filteredAppointments = appointments?.filter((apt) => {
    if (filter.status && apt.status !== filter.status) return false;
    if (filter.date) {
      const aptDate = new Date(apt.date).toISOString().split("T")[0];
      if (aptDate !== filter.date) return false;
    }
    return true;
  });

  if (isLoading) {
    return <Loading />;
  }

  const pageTitle = isVetView ? "My Appointments" : "All Appointments";
  const canUpdateStatus =
    user?.role === "veterinary" || ["admin", "co-admin"].includes(user?.role);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">{pageTitle}</h2>
        {!isVetView && (
          <Link to="/appointments/book" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Book Appointment
          </Link>
        )}
      </div>

      {isError && (
        <Alert variant="danger" dismissible>
          {message}
        </Alert>
      )}

      {isSuccess && message && (
        <Alert variant="success" dismissible>
          {message}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
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
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
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

            <Col md={4} className="d-flex align-items-end">
              <Button variant="secondary" onClick={resetFilters}>
                <i className="bi bi-x-circle me-2"></i>Reset Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Appointments Table */}
      {filteredAppointments && filteredAppointments.length > 0 ? (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Pet</th>
                  <th>{isVetView ? "Customer" : "Veterinarian"}</th>
                  <th>Reason</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>
                      <div className="fw-semibold">{appointment.petName}</div>
                      <small className="text-muted">
                        {appointment.petType}
                      </small>
                    </td>
                    <td>
                      {isVetView ? (
                        <>
                          <div>{appointment.customer?.name || "N/A"}</div>
                          <small className="text-muted">
                            {appointment.customer?.phoneNumber ||
                              appointment.customer?.email ||
                              ""}
                          </small>
                        </>
                      ) : (
                        <>
                          <div>Dr. {appointment.veterinary?.name || "N/A"}</div>
                          <small className="text-muted">
                            {appointment.veterinary?.vetInfo?.specialization ||
                              ""}
                          </small>
                        </>
                      )}
                    </td>
                    <td>{appointment.reason || "General Checkup"}</td>
                    <td>
                      <div>{formatDate(appointment.date)}</div>
                      <small className="text-muted">
                        {appointment.timeSlot?.start
                          ? `${appointment.timeSlot.start} - ${appointment.timeSlot.end}`
                          : "N/A"}
                      </small>
                    </td>
                    <td>
                      <Badge bg={getStatusVariant(appointment.status)}>
                        {appointment.status || "Pending"}
                      </Badge>
                    </td>
                    <td>
                      <Link
                        to={`/appointments/${appointment._id}/view`}
                        className="btn btn-sm btn-outline-primary me-1"
                      >
                        <i className="bi bi-eye"></i> View
                      </Link>
                      {canUpdateStatus && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment)}
                        >
                          <i className="bi bi-pencil"></i> Update
                        </Button>
                      )}
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
            <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
            <h4>No Appointments Found</h4>
            <p className="text-muted">
              {filter.status || filter.date
                ? "Try adjusting your filters"
                : isVetView
                ? "No appointments have been scheduled with you yet"
                : "You haven't booked any appointments yet"}
            </p>
            {!isVetView && (
              <Link to="/appointments/book" className="btn btn-primary">
                Book an Appointment
              </Link>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <Row>
                  <Col>
                    <strong>Pet:</strong> {selectedAppointment.petName}
                  </Col>
                  <Col>
                    <strong>Date:</strong>{" "}
                    {formatDate(selectedAppointment.date)}
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col>
                    <strong>Customer:</strong>{" "}
                    {selectedAppointment.customer?.name || "N/A"}
                  </Col>
                  <Col>
                    <strong>Time:</strong>{" "}
                    {selectedAppointment.timeSlot?.start || "N/A"}
                  </Col>
                </Row>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Appointment Status</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Payment Status</Form.Label>
                <Form.Select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the appointment..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitStatusUpdate}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AppointmentList;
