import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createAppointment,
  resetAppointments,
} from "../../redux/slices/appointmentSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";
import { formatDate } from "../../utils/formatters";

const BookAppointment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.appointments
  );

  const [formData, setFormData] = useState({
    petName: "",
    petType: "",
    service: "",
    date: "",
    timeSlot: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  const services = [
    "General Checkup",
    "Vaccination",
    "Grooming",
    "Dental Care",
    "Surgery Consultation",
    "Emergency Care",
    "Behavioral Consultation",
    "Other",
  ];

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        navigate("/appointments/confirmation");
      }, 1500);
    }
  }, [isSuccess, navigate]);

  useEffect(() => {
    return () => dispatch(resetAppointments());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.petName || formData.petName.trim().length < 2) {
      newErrors.petName = "Pet name is required";
    }

    if (!formData.petType) {
      newErrors.petType = "Pet type is required";
    }

    if (!formData.service) {
      newErrors.service = "Please select a service";
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
      ...formData,
      userId: user._id,
    };

    dispatch(createAppointment(appointmentData));
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="fw-bold mb-1">Book an Appointment</h3>
              <p className="text-muted mb-4">
                Schedule a visit with our veterinary professionals
              </p>

              {isError && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => dispatch(resetAppointments())}
                >
                  {message}
                </Alert>
              )}

              {isSuccess && (
                <Alert variant="success">
                  Appointment booked successfully! Redirecting...
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
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

                  <Col md={6}>
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
                        <option value="Other">Other</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.petType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Service Required <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    isInvalid={!!errors.service}
                  >
                    <option value="">Select service...</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.service}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Preferred Date <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={getMinDate()}
                        isInvalid={!!errors.date}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.date}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Time Slot <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="timeSlot"
                        value={formData.timeSlot}
                        onChange={handleChange}
                        isInvalid={!!errors.timeSlot}
                      >
                        <option value="">Select time...</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.timeSlot}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any specific concerns or information for the vet..."
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? "Booking..." : "Book Appointment"}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/appointments")}
                    disabled={isLoading}
                  >
                    Cancel
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
