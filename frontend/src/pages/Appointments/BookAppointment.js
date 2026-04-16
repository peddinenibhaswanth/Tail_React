import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createAppointment,
  resetAppointments,
  getVeterinaries,
  getAvailableSlots,
  clearAvailableSlots,
} from "../../redux/slices/appointmentSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Inline SVG placeholder to prevent infinite error loops
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23e0e0e0' width='60' height='60'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";

const BookAppointment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const {
    isLoading,
    isError,
    isSuccess,
    message,
    veterinaries,
    availableSlots,
  } = useSelector((state) => state.appointments);

  const [formData, setFormData] = useState({
    petName: "",
    petType: "",
    petAge: "",
    veterinary: "",
    reason: "",
    date: "",
    timeSlot: "",
  });

  const [errors, setErrors] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const reasons = [
    "General Checkup",
    "Vaccination",
    "Grooming",
    "Dental Care",
    "Surgery Consultation",
    "Emergency Care",
    "Behavioral Consultation",
    "Skin/Allergy Issues",
    "Digestive Problems",
    "Injury Treatment",
    "Other",
  ];

  // Fetch veterinaries on mount
  useEffect(() => {
    dispatch(getVeterinaries());
  }, [dispatch]);

  // Fetch available slots when vet and date are selected
  useEffect(() => {
    if (formData.veterinary && formData.date) {
      setLoadingSlots(true);
      dispatch(
        getAvailableSlots({
          veterinary: formData.veterinary,
          date: formData.date,
        })
      ).finally(() => setLoadingSlots(false));
    } else {
      dispatch(clearAvailableSlots());
    }
  }, [dispatch, formData.veterinary, formData.date]);

  useEffect(() => {
    if (isSuccess && message?.includes("successfully")) {
      setTimeout(() => {
        navigate("/my-appointments");
      }, 1500);
    }
  }, [isSuccess, message, navigate]);

  useEffect(() => {
    return () => {
      dispatch(resetAppointments());
      dispatch(clearAvailableSlots());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset time slot when vet or date changes
    if (name === "veterinary" || name === "date") {
      setFormData((prev) => ({ ...prev, [name]: value, timeSlot: "" }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.petName || formData.petName.trim().length < 2) {
      newErrors.petName = "Pet name is required (at least 2 characters)";
    }

    if (!formData.petType) {
      newErrors.petType = "Pet type is required";
    }

    if (!formData.veterinary) {
      newErrors.veterinary = "Please select a veterinarian";
    }

    if (!formData.reason) {
      newErrors.reason = "Please select the reason for visit";
    }

    if (!formData.date) {
      newErrors.date = "Please select a date";
    } else {
      const selectedDate = new Date(formData.date);
      if (selectedDate < today) {
        newErrors.date = "Please select a future date";
      }
    }

    if (!formData.timeSlot) {
      newErrors.timeSlot = "Please select a time slot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const appointmentData = {
      petName: formData.petName,
      petType: formData.petType,
      petAge: formData.petAge,
      veterinary: formData.veterinary,
      reason: formData.reason,
      date: formData.date,
      timeSlot: formData.timeSlot,
    };

    dispatch(createAppointment(appointmentData));
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Get selected vet details
  const selectedVet = veterinaries?.find((v) => v._id === formData.veterinary);

  if (isLoading && !veterinaries?.length) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="fw-bold mb-1">
                <i className="bi bi-calendar-plus me-2"></i>
                Book an Appointment
              </h3>
              <p className="text-muted mb-4">
                Schedule a visit with our certified veterinary professionals
              </p>

              {isError && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => dispatch(resetAppointments())}
                >
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {message}
                </Alert>
              )}

              {isSuccess && (
                <Alert variant="success">
                  <i className="bi bi-check-circle me-2"></i>
                  Appointment booked successfully! Redirecting to your
                  appointments...
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Pet Information Section */}
                <Card className="mb-4 bg-light">
                  <Card.Body>
                    <h5 className="mb-3">
                      <i className="bi bi-heart me-2"></i>Pet Information
                    </h5>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Pet Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="petName"
                            value={formData.petName}
                            onChange={handleChange}
                            placeholder="Enter your pet's name"
                            isInvalid={!!errors.petName}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.petName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Pet Type <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            name="petType"
                            value={formData.petType}
                            onChange={handleChange}
                            isInvalid={!!errors.petType}
                          >
                            <option value="">Select pet type...</option>
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Bird">Bird</option>
                            <option value="Rabbit">Rabbit</option>
                            <option value="Fish">Fish</option>
                            <option value="Hamster">Hamster</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.petType}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pet Age</Form.Label>
                          <Form.Control
                            type="text"
                            name="petAge"
                            value={formData.petAge}
                            onChange={handleChange}
                            placeholder="e.g., 2 years"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Veterinarian Selection Section */}
                <Card className="mb-4 bg-light">
                  <Card.Body>
                    <h5 className="mb-3">
                      <i className="bi bi-person-badge me-2"></i>Select
                      Veterinarian
                    </h5>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Choose a Doctor <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="veterinary"
                        value={formData.veterinary}
                        onChange={handleChange}
                        isInvalid={!!errors.veterinary}
                      >
                        <option value="">Select a veterinarian...</option>
                        {veterinaries?.map((vet) => (
                          <option key={vet._id} value={vet._id}>
                            Dr. {vet.name}{" "}
                            {vet.vetInfo?.specialization
                              ? `- ${vet.vetInfo.specialization}`
                              : ""}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.veterinary}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {/* Show selected vet details */}
                    {selectedVet && (
                      <Card className="border-primary">
                        <Card.Body>
                          <Row className="align-items-center">
                            <Col xs="auto">
                              <img
                                src={
                                  selectedVet.profilePicture
                                    ? `${API_URL}/uploads/users/${selectedVet.profilePicture}`
                                    : DEFAULT_AVATAR
                                }
                                alt={selectedVet.name}
                                className="rounded-circle"
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  if (e.target.src !== DEFAULT_AVATAR) {
                                    e.target.src = DEFAULT_AVATAR;
                                  }
                                }}
                              />
                            </Col>
                            <Col>
                              <h6 className="mb-1">Dr. {selectedVet.name}</h6>
                              {selectedVet.vetInfo?.specialization && (
                                <Badge bg="info" className="me-2">
                                  {selectedVet.vetInfo.specialization}
                                </Badge>
                              )}
                              {selectedVet.vetInfo?.experience && (
                                <small className="text-muted">
                                  {selectedVet.vetInfo.experience} years
                                  experience
                                </small>
                              )}
                              <div className="mt-1">
                                <small className="text-muted">
                                  <i className="bi bi-envelope me-1"></i>
                                  {selectedVet.email}
                                </small>
                                {selectedVet.phoneNumber && (
                                  <small className="text-muted ms-3">
                                    <i className="bi bi-telephone me-1"></i>
                                    {selectedVet.phoneNumber}
                                  </small>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </Card.Body>
                </Card>

                {/* Appointment Details Section */}
                <Card className="mb-4 bg-light">
                  <Card.Body>
                    <h5 className="mb-3">
                      <i className="bi bi-calendar-event me-2"></i>Appointment
                      Details
                    </h5>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        Reason for Visit <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        isInvalid={!!errors.reason}
                      >
                        <option value="">Select reason...</option>
                        {reasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.reason}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Preferred Date{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={getMinDate()}
                            isInvalid={!!errors.date}
                            disabled={!formData.veterinary}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.date}
                          </Form.Control.Feedback>
                          {!formData.veterinary && (
                            <Form.Text className="text-muted">
                              Please select a veterinarian first
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Time Slot <span className="text-danger">*</span>
                          </Form.Label>
                          {loadingSlots ? (
                            <div className="text-center py-2">
                              <Spinner animation="border" size="sm" /> Loading
                              slots...
                            </div>
                          ) : (
                            <Form.Select
                              name="timeSlot"
                              value={formData.timeSlot}
                              onChange={handleChange}
                              isInvalid={!!errors.timeSlot}
                              disabled={!formData.veterinary || !formData.date}
                            >
                              <option value="">Select time slot...</option>
                              {availableSlots?.length > 0 ? (
                                availableSlots.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))
                              ) : formData.veterinary && formData.date ? (
                                <option disabled>No available slots</option>
                              ) : null}
                            </Form.Select>
                          )}
                          <Form.Control.Feedback type="invalid">
                            {errors.timeSlot}
                          </Form.Control.Feedback>
                          {!formData.veterinary || !formData.date ? (
                            <Form.Text className="text-muted">
                              Select doctor and date to see available slots
                            </Form.Text>
                          ) : availableSlots?.length === 0 && !loadingSlots ? (
                            <Form.Text className="text-danger">
                              No slots available. Try a different date.
                            </Form.Text>
                          ) : null}
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <div className="d-flex gap-2 justify-content-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={isLoading}
                  >
                    <i className="bi bi-x-lg me-2"></i>Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Booking...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>Book Appointment
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BookAppointment;
