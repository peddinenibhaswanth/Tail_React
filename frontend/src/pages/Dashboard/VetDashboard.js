import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Form,
  Modal,
} from "react-bootstrap";
import {
  getVetAppointments,
  updateAppointmentStatus,
} from "../../redux/slices/appointmentSlice";
import { getVeterinaryDashboard } from "../../redux/slices/dashboardSlice";
import useAuth from "../../hooks/useAuth";

const VetDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { appointments, isLoading: appointmentsLoading } = useSelector(
    (state) => state.appointments
  );
  const {
    dashboardData,
    isLoading: dashboardLoading,
    isError,
    message,
  } = useSelector((state) => state.dashboard);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    dispatch(getVetAppointments());
    dispatch(getVeterinaryDashboard());
  }, [dispatch]);

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: "info",
      confirmed: "primary",
      "in-progress": "warning",
      completed: "success",
      cancelled: "danger",
      "no-show": "secondary",
    };
    return statusColors[status] || "secondary";
  };

  const handleStatusUpdate = (appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status || "pending");
    setNewPaymentStatus(appointment.paymentStatus || "pending");
    setNotes(appointment.vetNotes || appointment.notes || "");
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

  const isLoading = appointmentsLoading || dashboardLoading;

  // Check if vet is approved
  if (!user?.isApproved) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Account Pending Approval</Alert.Heading>
          <p>
            Your veterinary account is pending approval from the administrator.
            You will be able to access the veterinary dashboard once approved.
          </p>
          <hr />
          <p className="mb-0">
            Please check back later or contact support for more information.
          </p>
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  // Extract nested data from API response
  const data = dashboardData || {};
  const stats = {
    totalAppointments: data.appointments?.total || appointments?.length || 0,
    upcomingAppointments: data.appointments?.upcoming || 0,
    todayAppointments: data.appointments?.today || 0,
    completedAppointments: data.appointments?.completed || 0,
    recentAppointments: data.appointments?.recent || 0,
    pendingAppointments:
      data.appointments?.byStatus?.find((s) => s._id === "scheduled")?.count ||
      0,
    totalRevenue: data.revenue?.total || 0,
  };

  const today = new Date().toDateString();
  const todayAppointments =
    appointments?.filter(
      (apt) => new Date(apt.date).toDateString() === today
    ) || [];
  const upcomingAppointments =
    appointments?.filter(
      (apt) =>
        new Date(apt.date) >= new Date() &&
        apt.status !== "cancelled" &&
        apt.status !== "completed"
    ) || [];
  const pendingAppointments =
    appointments?.filter((apt) => apt.status === "scheduled") || [];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Veterinary Dashboard</h2>
        <span className="text-muted">Welcome, Dr. {user?.name}</span>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-primary text-white">
            <Card.Body className="text-center">
              <div className="display-4">
                {stats.todayAppointments || todayAppointments.length}
              </div>
              <h6>Today's Appointments</h6>
              <small>Scheduled for today</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="text-center">
              <div className="display-4">
                {stats.pendingAppointments || pendingAppointments.length}
              </div>
              <h6>Pending</h6>
              <small>Awaiting confirmation</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-success text-white">
            <Card.Body className="text-center">
              <div className="display-4">
                {stats.completedAppointments || 0}
              </div>
              <h6>Completed</h6>
              <small>This month</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-info text-white">
            <Card.Body className="text-center">
              <div className="display-4">
                {stats.totalAppointments || appointments?.length || 0}
              </div>
              <h6>Total</h6>
              <small>All appointments</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Today's Schedule Alert */}
      {todayAppointments.length > 0 && (
        <Alert variant="info" className="d-flex align-items-center">
          <i className="bi bi-calendar-check me-2"></i>
          <span>
            You have <strong>{todayAppointments.length}</strong> appointment(s)
            scheduled for today.
          </span>
        </Alert>
      )}

      {/* Quick Actions */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title">
                <i className="bi bi-calendar-week me-2"></i>My Schedule
              </h5>
              <p className="text-muted">
                View and manage your appointment schedule.
              </p>
              <Link to="/vet/appointments" className="btn btn-primary">
                View Schedule
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title">
                <i className="bi bi-person me-2"></i>My Profile
              </h5>
              <p className="text-muted">
                Update your profile and availability settings.
              </p>
              <Link to="/profile" className="btn btn-outline-primary">
                Edit Profile
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title">
                <i className="bi bi-clock-history me-2"></i>History
              </h5>
              <p className="text-muted">
                View past appointments and patient records.
              </p>
              <Link to="/vet/history" className="btn btn-outline-secondary">
                View History
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Today's Appointments */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-calendar-day me-2"></i>Today's Appointments
          </h5>
          <Badge bg="primary">{todayAppointments.length} scheduled</Badge>
        </Card.Header>
        <Card.Body>
          {todayAppointments.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Pet</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>
                      <strong>
                        {appointment.timeSlot?.start ||
                          appointment.time ||
                          "N/A"}
                      </strong>
                    </td>
                    <td>
                      {appointment.customer?.name ||
                        appointment.user?.name ||
                        "N/A"}
                    </td>
                    <td>
                      {appointment.petName || appointment.pet?.name || "N/A"}
                    </td>
                    <td>{appointment.reason || "General checkup"}</td>
                    <td>
                      <Badge
                        bg={getStatusBadge(appointment.status)}
                        className="text-uppercase"
                      >
                        {appointment.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleStatusUpdate(appointment)}
                      >
                        Update
                      </Button>
                      <Link
                        to={`/appointments/${appointment._id}`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-calendar-x display-4 text-muted"></i>
              <p className="text-muted mt-2">
                No appointments scheduled for today.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-calendar-range me-2"></i>Upcoming Appointments
          </h5>
          <Link
            to="/vet/appointments"
            className="btn btn-sm btn-outline-primary"
          >
            View All
          </Link>
        </Card.Header>
        <Card.Body>
          {upcomingAppointments.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Pet</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.slice(0, 10).map((appointment) => (
                  <tr key={appointment._id}>
                    <td>{new Date(appointment.date).toLocaleDateString()}</td>
                    <td>
                      {appointment.timeSlot?.start || appointment.time || "N/A"}
                    </td>
                    <td>
                      {appointment.customer?.name ||
                        appointment.user?.name ||
                        "N/A"}
                    </td>
                    <td>
                      {appointment.petName || appointment.pet?.name || "N/A"}
                    </td>
                    <td>
                      {appointment.customer?.phoneNumber ||
                        appointment.customer?.email ||
                        appointment.user?.phone ||
                        appointment.user?.email ||
                        "N/A"}
                    </td>
                    <td>
                      <Badge
                        bg={getStatusBadge(appointment.status)}
                        className="text-uppercase"
                      >
                        {appointment.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleStatusUpdate(appointment)}
                      >
                        Update
                      </Button>
                      <Link
                        to={`/appointments/${appointment._id}/view`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No upcoming appointments.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Status Update Modal */}
      <Modal
        show={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p>
                    <strong>Patient:</strong>{" "}
                    {selectedAppointment.customer?.name ||
                      selectedAppointment.user?.name}
                  </p>
                  <p>
                    <strong>Pet:</strong>{" "}
                    {selectedAppointment.petName ||
                      selectedAppointment.pet?.name}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedAppointment.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {selectedAppointment.timeSlot?.start ||
                      selectedAppointment.time}
                  </p>
                </Col>
              </Row>
              <hr />
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
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VetDashboard;
