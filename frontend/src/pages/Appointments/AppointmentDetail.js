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
} from "../../redux/slices/appointmentSlice";
import useAuth from "../../hooks/useAuth";
import MapComponent, { greenIcon } from "../../components/common/MapComponent";

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const { appointment, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.appointments
  );

  useEffect(() => {
    dispatch(getAppointment(id));
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

  if (isLoading && !appointment) {
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
        <Button variant="outline-secondary" className="rounded-pill" onClick={() => navigate(-1)}>
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
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  Appointment Information
                </h5>
                <Badge bg={getStatusBadge(appointment.status)} className="rounded-pill fs-6">
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

          {/* Consultation Mode */}
          {appointment.consultationMode && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="d-flex align-items-center gap-3">
                <i
                  className={`bi ${
                    appointment.consultationMode === "in-clinic"
                      ? "bi-hospital"
                      : appointment.consultationMode === "home-visit"
                        ? "bi-house-door"
                        : "bi-camera-video"
                  } fs-4 text-primary`}
                ></i>
                <div>
                  <small className="text-muted">Consultation Type</small>
                  <p className="mb-0 fw-bold text-capitalize">
                    {appointment.consultationMode?.replace("-", " ")}
                  </p>
                </div>
                {appointment.consultationFee != null && (
                  <Badge bg="success" className="ms-auto rounded-pill fs-6">
                    ₹{appointment.consultationFee}
                  </Badge>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Veterinarian Info */}
          <Card className="border-0 shadow-sm mb-4">
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

              {/* Clinic Address */}
              {(() => {
                const vet = appointment.veterinary;
                const addr = vet?.vetInfo?.clinicAddress;
                const fullAddr = vet?.vetInfo?.fullAddress;
                const displayAddr =
                  addr && typeof addr === "object"
                    ? [addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
                        .filter(Boolean)
                        .join(", ")
                    : typeof addr === "string"
                      ? addr
                      : fullAddr || null;

                const coords = vet?.vetInfo?.coordinates?.coordinates;
                const hasCoords = coords && coords[0] !== 0 && coords[1] !== 0;

                if (!displayAddr && !hasCoords) return null;

                return (
                  <div className="mt-3 pt-3 border-top">
                    {displayAddr && (
                      <p className="mb-2">
                        <i className="bi bi-geo-alt text-primary me-2"></i>
                        <strong>Clinic Address:</strong> {displayAddr}
                      </p>
                    )}
                    {vet?.vetInfo?.clinicName && (
                      <p className="mb-2">
                        <i className="bi bi-hospital text-primary me-2"></i>
                        <strong>Clinic:</strong> {vet.vetInfo.clinicName}
                      </p>
                    )}
                    {hasCoords && (
                      <div className="mt-2">
                        <MapComponent
                          center={[coords[1], coords[0]]}
                          zoom={15}
                          markers={[
                            {
                              position: [coords[1], coords[0]],
                              icon: greenIcon,
                              popup: `${vet?.vetInfo?.clinicName || "Clinic"} - Dr. ${vet?.name}`,
                            },
                          ]}
                          height="200px"
                        />
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm rounded-pill mt-2 w-100"
                        >
                          <i className="bi bi-sign-turn-right me-1"></i>
                          Get Directions
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Appointment Status Card */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>Status
              </h5>
            </Card.Header>
            <Card.Body>
              {(() => {
                const isViewerCustomer = appointment.customer?._id === user?._id;
                const isViewerVet = appointment.veterinary?._id === user?._id;
                const isViewerAdmin = ["admin", "co-admin"].includes(user?.role);
                const cancelledByRole = appointment.cancelledByRole;

                // --- PENDING ---
                if (appointment.status === "pending") {
                  if (isViewerCustomer) {
                    return (
                      <Alert variant="warning" className="mb-3">
                        <i className="bi bi-hourglass-split me-2"></i>
                        Your appointment is pending confirmation from the veterinarian.
                      </Alert>
                    );
                  }
                  if (isViewerVet) {
                    return (
                      <Alert variant="warning" className="mb-3">
                        <i className="bi bi-hourglass-split me-2"></i>
                        This appointment is awaiting your confirmation.
                      </Alert>
                    );
                  }
                  if (isViewerAdmin) {
                    return (
                      <Alert variant="warning" className="mb-3">
                        <i className="bi bi-hourglass-split me-2"></i>
                        This appointment is pending confirmation from the veterinarian.
                      </Alert>
                    );
                  }
                }

                // --- SCHEDULED ---
                if (appointment.status === "scheduled") {
                  if (isViewerCustomer) {
                    return (
                      <Alert variant="info" className="mb-3">
                        <i className="bi bi-calendar-check me-2"></i>
                        Your appointment is scheduled. Please arrive on time.
                      </Alert>
                    );
                  }
                  if (isViewerVet) {
                    return (
                      <Alert variant="info" className="mb-3">
                        <i className="bi bi-calendar-check me-2"></i>
                        This appointment is scheduled with the customer.
                      </Alert>
                    );
                  }
                  if (isViewerAdmin) {
                    return (
                      <Alert variant="info" className="mb-3">
                        <i className="bi bi-calendar-check me-2"></i>
                        This appointment is scheduled between the customer and veterinarian.
                      </Alert>
                    );
                  }
                }

                // --- CONFIRMED ---
                if (appointment.status === "confirmed") {
                  if (isViewerCustomer) {
                    return (
                      <Alert variant="success" className="mb-3">
                        <i className="bi bi-check-circle me-2"></i>
                        Your appointment has been confirmed by the veterinarian.
                      </Alert>
                    );
                  }
                  if (isViewerVet) {
                    return (
                      <Alert variant="success" className="mb-3">
                        <i className="bi bi-check-circle me-2"></i>
                        You have confirmed this appointment.
                      </Alert>
                    );
                  }
                  if (isViewerAdmin) {
                    return (
                      <Alert variant="success" className="mb-3">
                        <i className="bi bi-check-circle me-2"></i>
                        This appointment has been confirmed by the veterinarian.
                      </Alert>
                    );
                  }
                }

                // --- COMPLETED ---
                if (appointment.status === "completed") {
                  if (isViewerCustomer) {
                    return (
                      <Alert variant="success" className="mb-3">
                        <i className="bi bi-check-circle me-2"></i>
                        Your appointment has been completed.
                      </Alert>
                    );
                  }
                  if (isViewerVet) {
                    return (
                      <Alert variant="success" className="mb-3">
                        <i className="bi bi-check-circle me-2"></i>
                        You have completed this appointment.
                      </Alert>
                    );
                  }
                  if (isViewerAdmin) {
                    return (
                      <Alert variant="success" className="mb-3">
                        <i className="bi bi-check-circle me-2"></i>
                        This appointment has been completed by the veterinarian.
                      </Alert>
                    );
                  }
                }

                // --- CANCELLED ---
                if (appointment.status === "cancelled") {
                  let cancelMsg = "This appointment has been cancelled.";
                  if (cancelledByRole) {
                    if (isViewerCustomer) {
                      cancelMsg = cancelledByRole === "customer"
                        ? "You cancelled this appointment."
                        : "This appointment was cancelled by the veterinarian.";
                    } else if (isViewerVet) {
                      cancelMsg = cancelledByRole === "veterinary"
                        ? "You cancelled this appointment."
                        : "This appointment was cancelled by the customer.";
                    } else if (isViewerAdmin) {
                      cancelMsg = cancelledByRole === "customer"
                        ? "This appointment was cancelled by the customer."
                        : "This appointment was cancelled by the veterinarian.";
                    }
                  }
                  return (
                    <Alert variant="danger" className="mb-3">
                      <i className="bi bi-x-circle me-2"></i>
                      {cancelMsg}
                    </Alert>
                  );
                }

                // --- NO-SHOW ---
                if (appointment.status === "no-show") {
                  if (isViewerCustomer) {
                    return (
                      <Alert variant="secondary" className="mb-3">
                        <i className="bi bi-person-x me-2"></i>
                        You were marked as a no-show for this appointment.
                      </Alert>
                    );
                  }
                  if (isViewerVet) {
                    return (
                      <Alert variant="secondary" className="mb-3">
                        <i className="bi bi-person-x me-2"></i>
                        The customer was marked as a no-show for this appointment.
                      </Alert>
                    );
                  }
                  if (isViewerAdmin) {
                    return (
                      <Alert variant="secondary" className="mb-3">
                        <i className="bi bi-person-x me-2"></i>
                        The customer was marked as a no-show by the veterinarian.
                      </Alert>
                    );
                  }
                }

                return null;
              })()}

              {/* Payment Info */}
              {appointment.consultationFee != null && (
                <div className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Consultation Fee</span>
                    <span className="fw-bold fs-5">₹{appointment.consultationFee}</span>
                  </div>
                  {appointment.paymentStatus && (
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="text-muted">Payment</span>
                      <Badge bg={appointment.paymentStatus === "paid" ? "success" : "warning"}>
                        {appointment.paymentStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Cancel button - only for customer/vet on pending/scheduled/confirmed appointments */}
              {(appointment.status === "pending" || appointment.status === "scheduled" || appointment.status === "confirmed") &&
                !(["admin", "co-admin"].includes(user?.role)) && (
                <Button
                  variant="outline-danger"
                  className="w-100 rounded-pill"
                  onClick={handleCancel}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel Appointment
                </Button>
              )}
            </Card.Body>
          </Card>

          {/* Booked By Card */}
          {appointment.customer && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-person me-2"></i>Booked By
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: "45px", height: "45px", fontSize: "18px" }}
                  >
                    {appointment.customer?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h6 className="mb-0">{appointment.customer?.name || "N/A"}</h6>
                    <small className="text-muted">{appointment.customer?.email || ""}</small>
                    {appointment.customer?.phoneNumber && (
                      <div className="small text-muted">
                        <i className="bi bi-telephone me-1"></i>
                        {appointment.customer.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AppointmentDetail;
