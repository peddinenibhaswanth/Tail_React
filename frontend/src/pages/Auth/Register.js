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
import LocationPickerMap from "../../components/common/LocationPickerMap";
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
    // Organization specific fields
    orgName: "",
    orgAddress: "",
    orgPhone: "",
    registrationNumber: "",
    orgDescription: "",
    // Veterinary specific fields
    clinicName: "",
    clinicAddressLine1: "",
    clinicAddressLine2: "",
    clinicCity: "",
    clinicState: "",
    clinicPincode: "",
    licenseNumber: "",
    specialization: "",
    experience: "",
    consultationFee: "",
    consultationModes: ["in-clinic"],
    consultationFeeInClinic: "",
    consultationFeeHomeVisit: "",
    consultationFeeVideo: "",
    homeVisitRadius: "10",
    clinicLat: null,
    clinicLng: null,
    availableDays: [],
    availableTimeSlots: [],
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
    // Organization fields
    orgName,
    orgAddress,
    orgPhone,
    registrationNumber,
    orgDescription,
    clinicName,
    clinicAddressLine1,
    clinicAddressLine2,
    clinicCity,
    clinicState,
    clinicPincode,
    licenseNumber,
    specialization,
    experience,
    consultationFee,
    consultationModes,
    consultationFeeInClinic,
    consultationFeeHomeVisit,
    consultationFeeVideo,
    homeVisitRadius,
    clinicLat,
    clinicLng,
    availableDays,
    availableTimeSlots,
  } = formData;

  // Default time slots options for veterinary
  const defaultTimeSlotOptions = [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "12:00", end: "13:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
    { start: "17:00", end: "18:00" },
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Handle checkbox change for available days
  const handleDayChange = (day) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  // Handle checkbox change for time slots
  const handleTimeSlotChange = (slot) => {
    const slotKey = `${slot.start}-${slot.end}`;
    setFormData((prev) => {
      const exists = prev.availableTimeSlots.some(
        (s) => `${s.start}-${s.end}` === slotKey
      );
      return {
        ...prev,
        availableTimeSlots: exists
          ? prev.availableTimeSlots.filter(
              (s) => `${s.start}-${s.end}` !== slotKey
            )
          : [...prev.availableTimeSlots, slot],
      };
    });
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, message } = useAuth();

  useEffect(() => {
    // Only redirect on explicit success, not just because user exists in state
    if (isSuccess) {
      navigate("/dashboard");
    }
  }, [isSuccess, navigate]);

  // Separate effect to clear error after a delay so user can read it
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => dispatch(reset()), 5000);
      return () => clearTimeout(timer);
    }
  }, [isError, dispatch]);

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

    // Organization validation
    if (role === "organization") {
      if (!orgName || orgName.trim().length < 2) {
        newErrors.orgName = "Organization name is required";
      }
      if (!orgAddress || orgAddress.trim().length < 5) {
        newErrors.orgAddress = "Organization address is required";
      }
      if (!registrationNumber || registrationNumber.trim().length < 3) {
        newErrors.registrationNumber = "Registration number is required";
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

    // Add organization info if role is organization
    if (role === "organization") {
      userData.organizationInfo = {
        orgName,
        orgAddress,
        orgPhone,
        registrationNumber,
        description: orgDescription,
      };
    }

    // Add vet info if role is veterinary
    if (role === "veterinary") {
      const fees = {};
      if (consultationModes.includes("in-clinic"))
        fees["in-clinic"] = parseFloat(consultationFeeInClinic) || parseFloat(consultationFee) || 0;
      if (consultationModes.includes("home-visit"))
        fees["home-visit"] = parseFloat(consultationFeeHomeVisit) || 0;
      if (consultationModes.includes("video-consultation"))
        fees["video-consultation"] = parseFloat(consultationFeeVideo) || 0;

      userData.vetInfo = {
        clinicName,
        clinicAddress: {
          line1: clinicAddressLine1,
          line2: clinicAddressLine2,
          city: clinicCity,
          state: clinicState,
          pincode: clinicPincode,
        },
        licenseNumber,
        specialization: specialization
          ? specialization.split(",").map((s) => s.trim())
          : [],
        experience: parseInt(experience) || 0,
        consultationFee: parseFloat(consultationFeeInClinic) || parseFloat(consultationFee) || 0,
        consultationModes,
        consultationFees: fees,
        homeVisitRadius: consultationModes.includes("home-visit")
          ? parseInt(homeVisitRadius) || 10
          : undefined,
        availableDays: availableDays,
        availableTimeSlots: availableTimeSlots,
      };

      // Include manually selected coordinates from map
      if (clinicLat && clinicLng) {
        userData.vetInfo.manualCoordinates = {
          lat: clinicLat,
          lng: clinicLng,
        };
      }
    }

    dispatch(register(userData));
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={{ backgroundColor: 'var(--neutral-50)', minHeight: '80vh' }}>
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="auth-card shadow-sm border-0">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="feature-icon mx-auto mb-3">
                  <i className="bi bi-person-plus-fill fs-4"></i>
                </div>
                <h2 className="fw-bold">Create Account</h2>
                <p className="text-muted small">Join our pet adoption community</p>
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

              {(role === "seller" || role === "veterinary" || role === "organization") && (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  {role === "seller"
                    ? "Seller accounts require admin approval before you can list products."
                    : role === "organization"
                    ? "Organization accounts require admin approval before you can upload pets."
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
                    <option value="organization">
                      Pet Organization - Upload pets for adoption
                    </option>
                    <option value="veterinary">
                      Veterinary Doctor - Offer consultations
                    </option>
                    <option value="co-admin">
                      Co-Admin - Help manage the platform
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

                {/* Organization Information */}
                {role === "organization" && (
                  <>
                    <hr className="my-4" />
                    <h5 className="mb-3">
                      <i className="bi bi-building me-2"></i>
                      Organization Information
                    </h5>

                    <Form.Group className="mb-3">
                      <Form.Label>Organization Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgName"
                        value={orgName}
                        onChange={onChange}
                        placeholder="Enter your organization name"
                        isInvalid={!!errors.orgName}
                        required={role === "organization"}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.orgName}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Organization Address *</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgAddress"
                        value={orgAddress}
                        onChange={onChange}
                        placeholder="Enter your organization address"
                        isInvalid={!!errors.orgAddress}
                        required={role === "organization"}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.orgAddress}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Organization Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="orgPhone"
                            value={orgPhone}
                            onChange={onChange}
                            placeholder="Organization phone number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Registration Number *</Form.Label>
                          <Form.Control
                            type="text"
                            name="registrationNumber"
                            value={registrationNumber}
                            onChange={onChange}
                            placeholder="Organization registration number"
                            isInvalid={!!errors.registrationNumber}
                            required={role === "organization"}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.registrationNumber}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="orgDescription"
                        value={orgDescription}
                        onChange={onChange}
                        placeholder="Describe your organization and its mission"
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
                      <Form.Label>Clinic Address Line 1</Form.Label>
                      <Form.Control
                        type="text"
                        name="clinicAddressLine1"
                        value={clinicAddressLine1}
                        onChange={onChange}
                        placeholder="Street / Building / Area"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Clinic Address Line 2</Form.Label>
                      <Form.Control
                        type="text"
                        name="clinicAddressLine2"
                        value={clinicAddressLine2}
                        onChange={onChange}
                        placeholder="Landmark (optional)"
                      />
                    </Form.Group>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>City *</Form.Label>
                          <Form.Control
                            type="text"
                            name="clinicCity"
                            value={clinicCity}
                            onChange={onChange}
                            placeholder="City"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="clinicState"
                            value={clinicState}
                            onChange={onChange}
                            placeholder="State"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pincode</Form.Label>
                          <Form.Control
                            type="text"
                            name="clinicPincode"
                            value={clinicPincode}
                            onChange={onChange}
                            placeholder="6-digit pincode"
                            maxLength={6}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Clinic Location Map Picker */}
                    <LocationPickerMap
                      label="Pin Your Clinic on the Map"
                      height="280px"
                      initialLocation={
                        clinicLat && clinicLng
                          ? { lat: clinicLat, lng: clinicLng }
                          : null
                      }
                      onLocationChange={({ lat, lng }) => {
                        setFormData((prev) => ({
                          ...prev,
                          clinicLat: lat,
                          clinicLng: lng,
                        }));
                      }}
                    />

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
                          <Form.Label>Default Fee (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            name="consultationFee"
                            value={consultationFee}
                            onChange={onChange}
                            placeholder="Default fee"
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

                    {/* Consultation Modes */}
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="bi bi-check2-square me-2"></i>
                        Consultation Modes *
                      </Form.Label>
                      <div className="d-flex flex-wrap gap-3">
                        {[
                          { value: "in-clinic", label: "In-Clinic", icon: "bi-hospital" },
                          { value: "home-visit", label: "Home Visit", icon: "bi-house-door" },
                          { value: "video-consultation", label: "Video Call", icon: "bi-camera-video" },
                        ].map((mode) => (
                          <Form.Check
                            key={mode.value}
                            type="checkbox"
                            id={`mode-${mode.value}`}
                            label={
                              <span>
                                <i className={`bi ${mode.icon} me-1`}></i>
                                {mode.label}
                              </span>
                            }
                            checked={consultationModes.includes(mode.value)}
                            onChange={() => {
                              setFormData((prev) => ({
                                ...prev,
                                consultationModes: prev.consultationModes.includes(mode.value)
                                  ? prev.consultationModes.filter((m) => m !== mode.value)
                                  : [...prev.consultationModes, mode.value],
                              }));
                            }}
                          />
                        ))}
                      </div>
                      <Form.Text className="text-muted">
                        Select the ways patients can consult you
                      </Form.Text>
                    </Form.Group>

                    {/* Per-mode Fees */}
                    <Row>
                      {consultationModes.includes("in-clinic") && (
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>In-Clinic Fee (₹)</Form.Label>
                            <Form.Control
                              type="number"
                              name="consultationFeeInClinic"
                              value={consultationFeeInClinic}
                              onChange={onChange}
                              placeholder="Fee"
                              min="0"
                            />
                          </Form.Group>
                        </Col>
                      )}
                      {consultationModes.includes("home-visit") && (
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Home Visit Fee (₹)</Form.Label>
                            <Form.Control
                              type="number"
                              name="consultationFeeHomeVisit"
                              value={consultationFeeHomeVisit}
                              onChange={onChange}
                              placeholder="Fee"
                              min="0"
                            />
                          </Form.Group>
                        </Col>
                      )}
                      {consultationModes.includes("video-consultation") && (
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Video Call Fee (₹)</Form.Label>
                            <Form.Control
                              type="number"
                              name="consultationFeeVideo"
                              value={consultationFeeVideo}
                              onChange={onChange}
                              placeholder="Fee"
                              min="0"
                            />
                          </Form.Group>
                        </Col>
                      )}
                    </Row>

                    {/* Home Visit Radius */}
                    {consultationModes.includes("home-visit") && (
                      <Form.Group className="mb-3">
                        <Form.Label>Home Visit Radius (km)</Form.Label>
                        <Form.Control
                          type="number"
                          name="homeVisitRadius"
                          value={homeVisitRadius}
                          onChange={onChange}
                          placeholder="Max distance for home visits"
                          min="1"
                          max="100"
                        />
                        <Form.Text className="text-muted">
                          Maximum distance you're willing to travel for home visits
                        </Form.Text>
                      </Form.Group>
                    )}

                    {/* Available Days Selection */}
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="bi bi-calendar-week me-2"></i>
                        Available Days *
                      </Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <Form.Check
                            key={day}
                            type="checkbox"
                            id={`day-${day}`}
                            label={day}
                            checked={availableDays.includes(day)}
                            onChange={() => handleDayChange(day)}
                            className="me-3"
                          />
                        ))}
                      </div>
                      <Form.Text className="text-muted">
                        Select the days you are available for consultations
                      </Form.Text>
                    </Form.Group>

                    {/* Available Time Slots Selection */}
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="bi bi-clock me-2"></i>
                        Available Time Slots *
                      </Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        {defaultTimeSlotOptions.map((slot, index) => {
                          const slotKey = `${slot.start}-${slot.end}`;
                          const isSelected = availableTimeSlots.some(
                            (s) => `${s.start}-${s.end}` === slotKey
                          );
                          return (
                            <Form.Check
                              key={index}
                              type="checkbox"
                              id={`slot-${index}`}
                              label={`${slot.start} - ${slot.end}`}
                              checked={isSelected}
                              onChange={() => handleTimeSlotChange(slot)}
                              className="me-3"
                            />
                          );
                        })}
                      </div>
                      <Form.Text className="text-muted">
                        Select the time slots when you are available for appointments
                      </Form.Text>
                    </Form.Group>
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
                  className="w-100 mb-3 rounded-pill py-2 fw-semibold"
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
    </div>
  );
};

export default Register;
