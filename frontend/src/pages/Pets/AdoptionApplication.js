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
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getPetById } from "../../redux/slices/petSlice";
import axios from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";

const AdoptionApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { currentPet, isLoading } = useSelector((state) => state.pets);

  const [formData, setFormData] = useState({
    housingType: "",
    hasYard: false,
    otherPets: "",
    experience: "",
    reason: "",
    employmentStatus: "",
    references: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getPetById(id));
    }
  }, [dispatch, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.housingType) {
      newErrors.housingType = "Please select your housing type";
    }

    if (!formData.experience) {
      newErrors.experience = "Please describe your experience with pets";
    }

    if (!formData.reason || formData.reason.length < 50) {
      newErrors.reason =
        "Please provide a detailed reason (at least 50 characters)";
    }

    if (!formData.employmentStatus) {
      newErrors.employmentStatus = "Please select your employment status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const applicationData = {
        pet: id,
        ...formData,
        applicant: user._id,
      };

      await axios.post("/api/pets/adopt", applicationData);
      setSubmitSuccess(true);

      setTimeout(() => {
        navigate("/dashboard/applications");
      }, 2000);
    } catch (error) {
      setSubmitError(
        error.response?.data?.message || "Failed to submit application"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!currentPet) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Pet not found</Alert>
        <Button onClick={() => navigate("/pets")}>Back to Pets</Button>
      </Container>
    );
  }

  if (submitSuccess) {
    return (
      <Container className="py-5">
        <Alert variant="success">
          <Alert.Heading>Application Submitted Successfully!</Alert.Heading>
          <p>
            Your adoption application for <strong>{currentPet.name}</strong> has
            been submitted. We'll review your application and contact you soon.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="fw-bold mb-1">Adoption Application</h3>
              <p className="text-muted mb-4">
                Applying to adopt: <strong>{currentPet.name}</strong> (
                {currentPet.breed})
              </p>

              {submitError && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setSubmitError("")}
                >
                  {submitError}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Housing Type <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="housingType"
                        value={formData.housingType}
                        onChange={handleChange}
                        isInvalid={!!errors.housingType}
                      >
                        <option value="">Select...</option>
                        <option value="House">House</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Condo">Condo</option>
                        <option value="Farm">Farm</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.housingType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Employment Status <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleChange}
                        isInvalid={!!errors.employmentStatus}
                      >
                        <option value="">Select...</option>
                        <option value="Employed Full-time">
                          Employed Full-time
                        </option>
                        <option value="Employed Part-time">
                          Employed Part-time
                        </option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Retired">Retired</option>
                        <option value="Student">Student</option>
                        <option value="Unemployed">Unemployed</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.employmentStatus}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="hasYard"
                    label="I have a yard or outdoor space"
                    checked={formData.hasYard}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Other Pets</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="otherPets"
                    value={formData.otherPets}
                    onChange={handleChange}
                    placeholder="Do you have other pets? If yes, please describe..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Pet Experience <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="Describe your experience with pets..."
                    isInvalid={!!errors.experience}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.experience}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Why do you want to adopt {currentPet.name}?{" "}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Please provide a detailed explanation (minimum 50 characters)..."
                    isInvalid={!!errors.reason}
                  />
                  <Form.Text className="text-muted">
                    {formData.reason.length}/50 characters minimum
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.reason}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>References</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="references"
                    value={formData.references}
                    onChange={handleChange}
                    placeholder="Please provide contact information for 1-2 references (optional)"
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(`/pets/${id}`)}
                    disabled={submitting}
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

export default AdoptionApplication;
