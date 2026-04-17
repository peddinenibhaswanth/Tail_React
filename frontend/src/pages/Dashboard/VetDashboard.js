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
import { updateVetAddress } from "../../api/appointmentService";
import LocationPickerMap from "../../components/common/LocationPickerMap";
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

  // Clinic Settings state
  const [showClinicSettings, setShowClinicSettings] = useState(false);
  const [clinicForm, setClinicForm] = useState({
    line1: user?.vetInfo?.clinicAddress?.line1 || "",
    line2: user?.vetInfo?.clinicAddress?.line2 || "",
    city: user?.vetInfo?.clinicAddress?.city || "",
    state: user?.vetInfo?.clinicAddress?.state || "",
    pincode: user?.vetInfo?.clinicAddress?.pincode || "",
  });
  const [clinicCoords, setClinicCoords] = useState(() => {
    const coords = user?.vetInfo?.coordinates?.coordinates;
    if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
      return { lat: coords[1], lng: coords[0] };
    }
    return null;
  });
  const [clinicSaving, setClinicSaving] = useState(false);
  const [clinicMessage, setClinicMessage] = useState({ type: "", text: "" });

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

  const handleClinicFormChange = (e) => {
    setClinicForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClinicLocationChange = ({ lat, lng }) => {
    setClinicCoords({ lat, lng });
  };

  const handleSaveClinicSettings = async () => {
    if (!clinicForm.city) {
      setClinicMessage({ type: "danger", text: "City is required." });
      return;
    }
    setClinicSaving(true);
    setClinicMessage({ type: "", text: "" });
    try {
      const payload = {
        clinicAddress: {
          line1: clinicForm.line1,
          line2: clinicForm.line2,
          city: clinicForm.city,
          state: clinicForm.state,
          pincode: clinicForm.pincode,
        },
      };
      if (clinicCoords) {
        payload.lat = clinicCoords.lat;
        payload.lng = clinicCoords.lng;
      }
      const result = await updateVetAddress(payload);
      if (result.success) {
        setClinicMessage({ type: "success", text: result.message });
        // Update user in localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && result.data) {
          storedUser.vetInfo = result.data.vetInfo;
          localStorage.setItem("user", JSON.stringify(storedUser));
        }
      } else {
        setClinicMessage({
          type: "danger",
          text: result.message || "Failed to update clinic location.",
        });
      }
    } catch (err) {
      setClinicMessage({
        type: "danger",
        text:
          err?.response?.data?.message ||
          err.message ||
          "Error updating clinic location.",
      });
    } finally {
      setClinicSaving(false);
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
      (data.appointments?.byStatus?.find((s) => s._id === "scheduled")?.count || 0) +
      (data.appointments?.byStatus?.find((s) => s._id === "pending")?.count || 0),
    totalRevenue: data.revenue?.total || 0,
    commissionRate: data.revenue?.commissionRate || 10,
    commissionAmount: data.revenue?.commissionAmount || 0,
    netEarnings: data.revenue?.netEarnings || 0,
    paidAppointments: data.revenue?.paidAppointments || 0,
    pendingPayments: data.revenue?.pendingPayments || 0,
    pendingPaymentCount: data.revenue?.pendingPaymentCount || 0,
    allTimeTotalRevenue: data.revenue?.allTime?.totalRevenue || 0,
    allTimeCommission: data.revenue?.allTime?.commission || 0,
    allTimeNetEarnings: data.revenue?.allTime?.netEarnings || 0,
    allTimePaidAppointments: data.revenue?.allTime?.paidAppointments || 0,
    currentBalance: data.revenue?.currentBalance || 0,
  };

  const revenueTrendData = (data.revenueTrend || []).map((d) => ({
    date: (d._id || "").substring(5),
    revenue: Math.round(d.revenue || 0),
    appointments: d.count || 0,
  }));

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
    appointments?.filter((apt) => apt.status === "scheduled" || apt.status === "pending") || [];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Veterinary Dashboard</h2>
          <p className="text-muted mb-0 small">Welcome, Dr. {user?.name}</p>
        </div>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="dashboard-card dashboard-card-blue h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-calendar-check-fill"></i>
              </div>
              <div className="dashboard-card-value">
                {stats.todayAppointments || todayAppointments.length}
              </div>
              <div className="dashboard-card-label">Today's Appointments</div>
              <div className="dashboard-card-subtitle">Scheduled for today</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-orange h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="dashboard-card-value">
                {stats.pendingAppointments || pendingAppointments.length}
              </div>
              <div className="dashboard-card-label">Pending</div>
              <div className="dashboard-card-subtitle">Awaiting confirmation</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-green h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div className="dashboard-card-value">
                {stats.completedAppointments || 0}
              </div>
              <div className="dashboard-card-label">Completed</div>
              <div className="dashboard-card-subtitle">All time</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-teal h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-calendar2-range-fill"></i>
              </div>
              <div className="dashboard-card-value">
                {stats.totalAppointments || appointments?.length || 0}
              </div>
              <div className="dashboard-card-label">Total</div>
              <div className="dashboard-card-subtitle">All appointments</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Revenue & Earnings Section */}
      <Card className="dashboard-analytics-card mb-4">
        <Card.Header className="dashboard-analytics-header">
          <h5 className="mb-0 fw-bold">
            <i className="bi bi-currency-rupee me-2"></i>Revenue & Earnings
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0">
            {[
              {
                label: "Gross Revenue",
                value: stats.totalRevenue,
                sub: `${stats.paidAppointments} paid appointments`,
                bgColor: "#1565C0",
              },
              {
                label: `Commission (${stats.commissionRate}%)`,
                value: stats.commissionAmount,
                sub: "Platform fee deducted",
                bgColor: "#E65100",
              },
              {
                label: "Net Earnings",
                value: stats.netEarnings,
                sub: "Your take-home this period",
                bgColor: "#2E7D32",
              },
              {
                label: "Current Balance",
                value: stats.currentBalance,
                sub: "Available for payout",
                bgColor: "#7B1FA2",
              },
            ].map((r) => (
              <Col md={3} key={r.label} className="dashboard-analytics-metric">
                <div className="dashboard-analytics-metric-value" style={{ color: r.bgColor }}>
                  ₹{Math.round(r.value).toLocaleString()}
                </div>
                <div className="dashboard-analytics-metric-label">{r.label}</div>
                <div className="dashboard-analytics-metric-sub">{r.sub}</div>
              </Col>
            ))}
          </Row>
          {stats.pendingPayments > 0 && (
            <>
              <hr className="my-0" />
              <div className="px-4 py-3 bg-warning bg-opacity-10">
                <i className="bi bi-hourglass-split me-2 text-warning"></i>
                <strong>₹{Math.round(stats.pendingPayments).toLocaleString()}</strong>{" "}
                pending from <strong>{stats.pendingPaymentCount}</strong> unpaid appointment(s)
              </div>
            </>
          )}
          <hr className="my-0" />
          <Row className="g-0 px-4 py-3 bg-light">
            {[
              { label: "All-Time Revenue", value: stats.allTimeTotalRevenue, color: "#1565C0" },
              { label: "All-Time Commission", value: stats.allTimeCommission, color: "#E65100" },
              { label: "All-Time Net Earnings", value: stats.allTimeNetEarnings, color: "#2E7D32" },
              { label: "Total Paid Appointments", value: stats.allTimePaidAppointments, color: "#7B1FA2", isCurrency: false },
            ].map((r) => (
              <Col xs={6} md={3} key={r.label} className="text-center py-2">
                <div className="fw-bold" style={{ color: r.color }}>
                  {r.isCurrency === false ? r.value : `₹${Math.round(r.value).toLocaleString()}`}
                </div>
                <small className="text-muted">{r.label}</small>
              </Col>
            ))}
          </Row>
          {revenueTrendData.length > 0 && (
            <>
              <hr className="my-0" />
              <div className="p-4">
                <h6 className="text-muted mb-3 fw-semibold">
                  <i className="bi bi-graph-up me-2"></i>Revenue Trend
                </h6>
                <div style={{ width: "100%", height: 220 }}>
                  <table className="table table-sm table-bordered mb-0" style={{ fontSize: "0.8rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Revenue</th>
                        <th>Appointments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueTrendData.slice(-10).map((d) => (
                        <tr key={d.date}>
                          <td>{d.date}</td>
                          <td className="text-success fw-bold">₹{d.revenue.toLocaleString()}</td>
                          <td>{d.appointments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

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
              <Link to="/vet/appointments" className="btn btn-primary rounded-pill">
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
              <Link to="/profile" className="btn btn-outline-primary rounded-pill">
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
              <Link to="/vet/history" className="btn btn-outline-secondary rounded-pill">
                View History
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Clinic Location Settings */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
            Clinic Location
          </h5>
          <Button
            variant={showClinicSettings ? "outline-secondary" : "outline-primary"}
            size="sm"
            className="rounded-pill"
            onClick={() => setShowClinicSettings(!showClinicSettings)}
          >
            {showClinicSettings ? (
              <>
                <i className="bi bi-x-lg me-1"></i>Close
              </>
            ) : (
              <>
                <i className="bi bi-pencil me-1"></i>Update Location
              </>
            )}
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Current address display */}
          {!showClinicSettings && (
            <div>
              {user?.vetInfo?.fullAddress || user?.vetInfo?.clinicAddress?.city ? (
                <div>
                  <p className="mb-1">
                    <strong>Address:</strong>{" "}
                    {user?.vetInfo?.fullAddress ||
                      [
                        user?.vetInfo?.clinicAddress?.line1,
                        user?.vetInfo?.clinicAddress?.line2,
                        user?.vetInfo?.clinicAddress?.city,
                        user?.vetInfo?.clinicAddress?.state,
                        user?.vetInfo?.clinicAddress?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                  </p>
                  {user?.vetInfo?.coordinates?.coordinates &&
                    (user.vetInfo.coordinates.coordinates[0] !== 0 ||
                      user.vetInfo.coordinates.coordinates[1] !== 0) && (
                      <Badge bg="success" className="mt-1">
                        <i className="bi bi-check-circle me-1"></i>
                        Location pinned on map
                      </Badge>
                    )}
                  {(!user?.vetInfo?.coordinates?.coordinates ||
                    (user.vetInfo.coordinates.coordinates[0] === 0 &&
                      user.vetInfo.coordinates.coordinates[1] === 0)) && (
                    <Badge bg="warning" text="dark" className="mt-1">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Location not set — click "Update Location" to pin your clinic
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-geo-alt display-6 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">
                    No clinic address set. Click "Update Location" to add your clinic address and pin it on the map.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Edit form */}
          {showClinicSettings && (
            <div>
              {clinicMessage.text && (
                <Alert
                  variant={clinicMessage.type}
                  dismissible
                  onClose={() => setClinicMessage({ type: "", text: "" })}
                >
                  {clinicMessage.text}
                </Alert>
              )}

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address Line 1</Form.Label>
                    <Form.Control
                      type="text"
                      name="line1"
                      value={clinicForm.line1}
                      onChange={handleClinicFormChange}
                      placeholder="Street / Building / Area"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address Line 2</Form.Label>
                    <Form.Control
                      type="text"
                      name="line2"
                      value={clinicForm.line2}
                      onChange={handleClinicFormChange}
                      placeholder="Landmark (optional)"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>City *</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={clinicForm.city}
                      onChange={handleClinicFormChange}
                      placeholder="City"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={clinicForm.state}
                      onChange={handleClinicFormChange}
                      placeholder="State"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pincode</Form.Label>
                    <Form.Control
                      type="text"
                      name="pincode"
                      value={clinicForm.pincode}
                      onChange={handleClinicFormChange}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <LocationPickerMap
                label="Pin Your Clinic Location on the Map"
                height="350px"
                initialLocation={clinicCoords}
                onLocationChange={handleClinicLocationChange}
              />

              <div className="d-flex gap-2 mt-3">
                <Button
                  variant="primary"
                  className="rounded-pill px-4"
                  onClick={handleSaveClinicSettings}
                  disabled={clinicSaving}
                >
                  {clinicSaving ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i>
                      Save Location
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  className="rounded-pill"
                  onClick={() => setShowClinicSettings(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

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
                      {appointment.status === "cancelled" && appointment.cancelledByRole && (
                        <div className="mt-1">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            {appointment.cancelledByRole === "veterinary"
                              ? "You cancelled"
                              : appointment.cancelledByRole === "customer"
                                ? "by customer"
                                : `by ${appointment.cancelledByRole}`}
                          </small>
                        </div>
                      )}
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
            to="/vet/appointments?status=upcoming"
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
                      {appointment.status === "cancelled" && appointment.cancelledByRole && (
                        <div className="mt-1">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            {appointment.cancelledByRole === "veterinary"
                              ? "You cancelled"
                              : appointment.cancelledByRole === "customer"
                                ? "by customer"
                                : `by ${appointment.cancelledByRole}`}
                          </small>
                        </div>
                      )}
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
