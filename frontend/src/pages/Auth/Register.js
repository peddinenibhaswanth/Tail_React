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
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register, reset } from "../../redux/slices/authSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
} from "../../utils/validation";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    // Seller specific fields
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    taxId: "",
    businessDescription: "",
    // Veterinary specific fields
    clinicName: "",
    clinicAddress: "",
    licenseNumber: "",
    specialization: "",
    experience: "",
    consultationFee: "",
  });

  const [errors, setErrors] = useState({});
  const {
    name,
    email,
    phone,
    password,
    confirmPassword,
    role,
    businessName,
    businessAddress,
    businessPhone,
    taxId,
    businessDescription,
    clinicName,
    clinicAddress,
    licenseNumber,
    specialization,
    experience,
    consultationFee,
  } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading, isError, isSuccess, message } = useAuth();

  useEffect(() => {
    if (isError) {
      dispatch(reset());
    }

    if (isSuccess || user) {
      navigate("/dashboard");
    }
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name || name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isValidPhone(phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!isValidPassword(password)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Seller validation
    if (role === "seller") {
      if (!businessName || businessName.trim().length < 2) {
        newErrors.businessName = "Business name is required";
      }
      if (!businessAddress || businessAddress.trim().length < 5) {
        newErrors.businessAddress = "Business address is required";
      }
    }

    // Veterinary validation
    if (role === "veterinary") {
      if (!clinicName || clinicName.trim().length < 2) {
        newErrors.clinicName = "Clinic name is required";
      }
      if (!licenseNumber || licenseNumber.trim().length < 3) {
        newErrors.licenseNumber = "License number is required";
      }
      if (!experience || isNaN(experience) || parseInt(experience) < 0) {
        newErrors.experience = "Valid experience (years) is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const userData = {
      name,
      email,
      phone,
      password,
      role,
    };

    // Add seller info if role is seller
    if (role === "seller") {
      userData.sellerInfo = {
        businessName,
        businessAddress,
        businessPhone,
        taxId,
        description: businessDescription,
      };
    }

    // Add vet info if role is veterinary
    if (role === "veterinary") {
      userData.vetInfo = {
        clinicName,
        clinicAddress,
        licenseNumber,
        specialization: specialization
          ? specialization.split(",").map((s) => s.trim())
          : [],
        experience: parseInt(experience) || 0,
        consultationFee: parseFloat(consultationFee) || 0,
      };
    }

    dispatch(register(userData));
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold">Create Account</h2>
                <p className="text-muted">Join our pet adoption community</p>
              </div>

              {isError && message && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => dispatch(reset())}
                >
                  {message}
                </Alert>
              )}

              {(role === "seller" || role === "veterinary") && (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  {role === "seller"
                    ? "Seller accounts require admin approval before you can list products."
                    : "Veterinary accounts require admin verification before you can offer consultations."}
                </Alert>
              )}

              <Form onSubmit={onSubmit}>
                {/* Role Selection */}
                <Form.Group className="mb-3">
                  <Form.Label>Register as</Form.Label>
                  <Form.Select
                    name="role"
                    value={role}
                    onChange={onChange}
                    className="form-select-lg"
                  >
                    <option value="customer">
                      Customer - Adopt pets & buy products
                    </option>
                    <option value="seller">
                      Product Seller - Sell pet products
                    </option>
                    <option value="veterinary">
                      Veterinary Doctor - Offer consultations
                    </option>
                  </Form.Select>
                </Form.Group>

                <hr className="my-4" />

                {/* Basic Information */}
                <h5 className="mb-3">Basic Information</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={name}
                    onChange={onChange}
                    placeholder="Enter your full name"
                    isInvalid={!!errors.name}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        placeholder="Enter your email"
                        isInvalid={!!errors.email}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={onChange}
                        placeholder="Enter your phone number"
                        isInvalid={!!errors.phone}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        placeholder="Create a password"
                        isInvalid={!!errors.password}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        placeholder="Confirm your password"
                        isInvalid={!!errors.confirmPassword}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Seller Information */}
                {role === "seller" && (
                  <>
                    <hr className="my-4" />
                    <h5 className="mb-3">
                      <i className="bi bi-shop me-2"></i>
                      Business Information
                    </h5>

                    <Form.Group className="mb-3">
                      <Form.Label>Business Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessName"
                        value={businessName}
                        onChange={onChange}
                        placeholder="Enter your business name"
                        isInvalid={!!errors.businessName}
                        required={role === "seller"}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.businessName}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Business Address *</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessAddress"
                        value={businessAddress}
                        onChange={onChange}
                        placeholder="Enter your business address"
                        isInvalid={!!errors.businessAddress}
                        required={role === "seller"}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.businessAddress}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Business Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="businessPhone"
                            value={businessPhone}
                            onChange={onChange}
                            placeholder="Business phone number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Tax ID / GST Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="taxId"
                            value={taxId}
                            onChange={onChange}
                            placeholder="Enter tax ID"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Business Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="businessDescription"
                        value={businessDescription}
                        onChange={onChange}
                        placeholder="Describe your business and the products you sell"
                      />
                    </Form.Group>
                  </>
                )}

                {/* Veterinary Information */}
                {role === "veterinary" && (
                  <>
                    <hr className="my-4" />
                    <h5 className="mb-3">
                      <i className="bi bi-hospital me-2"></i>
                      Professional Information
                    </h5>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Clinic Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="clinicName"
                            value={clinicName}
                            onChange={onChange}
                            placeholder="Enter clinic name"
                            isInvalid={!!errors.clinicName}
                            required={role === "veterinary"}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.clinicName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>License Number *</Form.Label>
                          <Form.Control
                            type="text"
                            name="licenseNumber"
                            value={licenseNumber}
                            onChange={onChange}
                            placeholder="Veterinary license number"
                            isInvalid={!!errors.licenseNumber}
                            required={role === "veterinary"}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.licenseNumber}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Clinic Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="clinicAddress"
                        value={clinicAddress}
                        onChange={onChange}
                        placeholder="Enter clinic address"
                      />
                    </Form.Group>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Experience (Years) *</Form.Label>
                          <Form.Control
                            type="number"
                            name="experience"
                            value={experience}
                            onChange={onChange}
                            placeholder="Years of experience"
                            min="0"
                            isInvalid={!!errors.experience}
                            required={role === "veterinary"}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.experience}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Consultation Fee (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            name="consultationFee"
                            value={consultationFee}
                            onChange={onChange}
                            placeholder="Fee per consultation"
                            min="0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Specializations</Form.Label>
                          <Form.Control
                            type="text"
                            name="specialization"
                            value={specialization}
                            onChange={onChange}
                            placeholder="e.g., Dogs, Cats, Birds"
                          />
                          <Form.Text className="text-muted">
                            Separate with commas
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="I agree to the Terms and Conditions"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Register"}
                </Button>

                <div className="text-center">
                  <span className="text-muted">Already have an account? </span>
                  <Link to="/login" className="text-decoration-none fw-bold">
                    Login here
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
