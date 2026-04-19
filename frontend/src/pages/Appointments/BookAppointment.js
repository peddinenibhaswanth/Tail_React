import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Offcanvas,
  Modal,
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
import Loading from "../../components/common/Loading";
import LocationCapture from "../../components/common/LocationCapture";
import MapComponent, {
  redIcon,
  blueIcon,
  greenIcon,
} from "../../components/common/MapComponent";
import { resolveImageUrl } from "../../utils/imageUrl";

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23e0e0e0' width='60' height='60'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";

const BookAppointment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isLoading,
    isError,
    isSuccess,
    message,
    veterinaries,
    availableSlots,
  } = useSelector((state) => state.appointments);

  // --- Location & Search State ---
  const [customerLocation, setCustomerLocation] = useState(null);
  const [filters, setFilters] = useState({
    radius: 50,
    specialization: "",
    consultationMode: "",
    sortBy: "distance",
    maxFee: "",
  });
  const [filtersEnabled] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showMapView, setShowMapView] = useState(false);

  // --- Selected Vet & Booking State ---
  const [selectedVet, setSelectedVet] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [formData, setFormData] = useState({
    petName: "",
    petType: "",
    petAge: "",
    reason: "",
    date: "",
    timeSlot: "",
    consultationMode: "in-clinic",
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

  // --- Fetch vets when location or filters change ---
  const fetchVets = useCallback(() => {
    const params = {};

    if (filtersEnabled) {
      params.sortBy = filters.sortBy;
      if (customerLocation?.lat && customerLocation?.lng) {
        params.lat = customerLocation.lat;
        params.lng = customerLocation.lng;
        params.radius = filters.radius;
      }
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.consultationMode)
        params.consultationMode = filters.consultationMode;
      if (filters.maxFee) params.maxFee = filters.maxFee;
    } else {
      // No filters — fetch all approved vets
      if (customerLocation?.lat && customerLocation?.lng) {
        params.lat = customerLocation.lat;
        params.lng = customerLocation.lng;
        params.radius = 99999; // effectively no limit
      }
    }

    dispatch(getVeterinaries(params));
  }, [dispatch, customerLocation, filters, filtersEnabled]);

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  // Fetch available slots when vet and date selected
  useEffect(() => {
    if (selectedVet && formData.date) {
      setLoadingSlots(true);
      dispatch(
        getAvailableSlots({
          veterinary: selectedVet._id,
          date: formData.date,
        })
      ).finally(() => setLoadingSlots(false));
    } else {
      dispatch(clearAvailableSlots());
    }
  }, [dispatch, selectedVet, formData.date]);

  useEffect(() => {
    if (isSuccess && message?.includes("successfully")) {
      setTimeout(() => {
        setShowBookingModal(false);
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

  // --- Handlers ---
  const handleLocationChange = useCallback((loc) => {
    setCustomerLocation(loc);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      radius: 500,
      specialization: "",
      consultationMode: "",
      sortBy: "distance",
      maxFee: "",
    });
  };

  const handleSelectVet = (vet) => {
    setSelectedVet(vet);
    const modes = vet.vetInfo?.consultationModes || ["in-clinic"];
    setFormData((prev) => ({
      ...prev,
      consultationMode: modes[0] || "in-clinic",
      date: "",
      timeSlot: "",
    }));
    setShowBookingModal(true);
    dispatch(clearAvailableSlots());
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "date") {
      setFormData((prev) => ({ ...prev, date: value, timeSlot: "" }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.petName || formData.petName.trim().length < 2)
      newErrors.petName = "Pet name is required (at least 2 characters)";
    if (!formData.petType) newErrors.petType = "Pet type is required";
    if (!formData.reason) newErrors.reason = "Please select the reason";
    if (!formData.date) {
      newErrors.date = "Please select a date";
    } else if (new Date(formData.date) < today) {
      newErrors.date = "Please select a future date";
    }
    if (!formData.timeSlot) newErrors.timeSlot = "Please select a time slot";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm() || !selectedVet) return;

    dispatch(
      createAppointment({
        petName: formData.petName,
        petType: formData.petType,
        petAge: formData.petAge,
        veterinary: selectedVet._id,
        reason: formData.reason,
        date: formData.date,
        timeSlot: formData.timeSlot,
        consultationMode: formData.consultationMode,
      })
    );
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // --- Helpers ---
  const getConsultationFee = (vet, mode) => {
    if (vet.vetInfo?.consultationFees?.[mode]) {
      return vet.vetInfo.consultationFees[mode];
    }
    return vet.vetInfo?.consultationFee || 500;
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case "in-clinic":
        return "bi-hospital";
      case "home-visit":
        return "bi-house-door";
      case "video-consultation":
        return "bi-camera-video";
      default:
        return "bi-hospital";
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case "in-clinic":
        return "In-Clinic";
      case "home-visit":
        return "Home Visit";
      case "video-consultation":
        return "Video Call";
      default:
        return mode;
    }
  };

  const getFullAddress = (vet) => {
    const addr = vet.vetInfo?.clinicAddress;
    if (!addr) return vet.vetInfo?.fullAddress || "";
    if (typeof addr === "string") return addr;
    return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(", ");
  };

  const getVetCoords = (vet) => {
    const c = vet.vetInfo?.coordinates?.coordinates;
    if (c && c[0] !== 0 && c[1] !== 0) return [c[1], c[0]]; // [lat, lng]
    return null;
  };

  // Get unique specializations for filter dropdown
  const allSpecializations = useMemo(() => {
    const specs = new Set();
    veterinaries?.forEach((vet) => {
      const s = vet.vetInfo?.specialization;
      if (Array.isArray(s)) s.forEach((sp) => specs.add(sp));
      else if (typeof s === "string" && s) specs.add(s);
    });
    return Array.from(specs).sort();
  }, [veterinaries]);

  // --- Map markers ---
  const mapMarkers = useMemo(() => {
    const markers = [];
    if (customerLocation?.lat && customerLocation?.lng) {
      markers.push({
        position: [customerLocation.lat, customerLocation.lng],
        icon: blueIcon,
        popup: "📍 Your Location",
      });
    }
    veterinaries?.forEach((vet) => {
      const coords = getVetCoords(vet);
      if (coords) {
        markers.push({
          position: coords,
          icon: redIcon,
          popup: `Dr. ${vet.name} - ${vet.vetInfo?.clinicName || "Clinic"} (${vet._distance != null ? vet._distance + " km" : "N/A"})`,
        });
      }
    });
    return markers;
  }, [veterinaries, customerLocation]);

  const mapCenter = customerLocation?.lat
    ? [customerLocation.lat, customerLocation.lng]
    : [20.5937, 78.9629];

  if (isLoading && !veterinaries?.length) {
    return <Loading />;
  }

  return (
    <Container fluid className="py-4 px-3 px-lg-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-1">
            <i className="bi bi-search-heart me-2"></i>
            Find a Veterinarian
          </h3>
          <p className="text-muted mb-0">
            Search nearby vets and book an appointment
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant={showMapView ? "primary" : "outline-primary"}
            size="sm"
            className="rounded-pill d-none d-md-inline-flex"
            onClick={() => setShowMapView(!showMapView)}
          >
            <i
              className={`bi ${showMapView ? "bi-grid" : "bi-map"} me-1`}
            ></i>
            {showMapView ? "Grid View" : "Map View"}
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-pill d-md-none"
            onClick={() => setShowFilters(true)}
          >
            <i className="bi bi-funnel me-1"></i>Filters
          </Button>
        </div>
      </div>

      {/* Location Capture */}
      <LocationCapture
        onLocationChange={handleLocationChange}
        initialLocation={customerLocation}
      />

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

      <Row>
        {/* Filter Sidebar - Desktop */}
        <Col md={3} className="d-none d-md-block">
          <Card
            className="border-0 shadow-sm sticky-top"
            style={{ top: "80px" }}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-funnel me-1"></i>Filters
                </h6>
                <Button
                  variant="link"
                  size="sm"
                  className="text-decoration-none p-0"
                  onClick={clearFilters}
                >
                  Reset All
                </Button>
              </div>

              {/* Distance Radius */}
              {customerLocation && (
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">
                    Distance: {filters.radius} km
                  </Form.Label>
                  <Form.Range
                    min={5}
                    max={500}
                    step={5}
                    value={filters.radius}
                    onChange={(e) =>
                      handleFilterChange("radius", parseInt(e.target.value))
                    }
                  />
                  <div className="d-flex justify-content-between">
                    <small className="text-muted">5 km</small>
                    <small className="text-muted">500 km</small>
                  </div>
                  <Form.Control
                    type="number"
                    size="sm"
                    className="mt-2"
                    placeholder="Or enter distance in km"
                    value={filters.radius}
                    min={1}
                    max={5000}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) handleFilterChange("radius", val);
                    }}
                  />
                </Form.Group>
              )}

              {filtersEnabled && (
                <>
              {/* Specialization */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  Specialization
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.specialization}
                  onChange={(e) =>
                    handleFilterChange("specialization", e.target.value)
                  }
                >
                  <option value="">All Specializations</option>
                  {allSpecializations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Consultation Mode */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  Consultation Type
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.consultationMode}
                  onChange={(e) =>
                    handleFilterChange("consultationMode", e.target.value)
                  }
                >
                  <option value="">All Types</option>
                  <option value="in-clinic">In-Clinic</option>
                  <option value="home-visit">Home Visit</option>
                  <option value="video-consultation">Video Call</option>
                </Form.Select>
              </Form.Group>

              {/* Max Fee */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  Max Fee (₹)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  placeholder="Any"
                  value={filters.maxFee}
                  onChange={(e) =>
                    handleFilterChange("maxFee", e.target.value)
                  }
                  min={0}
                />
              </Form.Group>

              {/* Sort By */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Sort By</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.sortBy}
                  onChange={(e) =>
                    handleFilterChange("sortBy", e.target.value)
                  }
                >
                  <option value="distance">Nearest First</option>
                  <option value="fee">Lowest Fee</option>
                  <option value="experience">Most Experienced</option>
                </Form.Select>
              </Form.Group>
                </>
              )}

              <div className="text-muted small mt-2">
                <i className="bi bi-info-circle me-1"></i>
                {veterinaries?.length || 0} vets found
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Vet Results */}
        <Col md={9}>
          {/* Map View */}
          {showMapView && (
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body className="p-2">
                <MapComponent
                  center={mapCenter}
                  zoom={customerLocation ? 11 : 5}
                  markers={mapMarkers}
                  height="350px"
                />
              </Card.Body>
            </Card>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">
                Searching for veterinarians...
              </p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && (!veterinaries || veterinaries.length === 0) && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i
                  className="bi bi-search text-muted"
                  style={{ fontSize: "48px" }}
                ></i>
                <h5 className="mt-3">No veterinarians found</h5>
                <p className="text-muted">
                  Try increasing the search radius or changing your filters
                </p>
                <Button
                  variant="outline-primary"
                  className="rounded-pill"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          )}

          {/* Vet Grid */}
          {!isLoading && veterinaries && veterinaries.length > 0 && (
            <Row>
              {veterinaries.map((vet) => (
                <Col lg={4} md={6} sm={12} key={vet._id} className="mb-3">
                  <Card
                    className="h-100 border-0 shadow-sm"
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform =
                        "translateY(-4px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                    onClick={() => handleSelectVet(vet)}
                  >
                    <Card.Body className="p-3">
                      {/* Distance Badge */}
                      {vet._distance != null && (
                        <Badge
                          bg="success"
                          className="position-absolute rounded-pill"
                          style={{ top: "10px", right: "10px" }}
                        >
                          <i className="bi bi-geo-alt me-1"></i>
                          {vet._distance} km
                          {vet._duration
                            ? ` · ${vet._duration} min`
                            : ""}
                        </Badge>
                      )}

                      {/* Vet Photo & Name */}
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src={
                            vet.profileImage || vet.profilePicture
                              ? resolveImageUrl(
                                  vet.profileImage || vet.profilePicture,
                                  "users"
                                )
                              : DEFAULT_AVATAR
                          }
                          alt={vet.name}
                          className="rounded-circle me-3"
                          style={{
                            width: "55px",
                            height: "55px",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            if (e.target.src !== DEFAULT_AVATAR)
                              e.target.src = DEFAULT_AVATAR;
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h6 className="mb-0 fw-bold text-truncate">
                            Dr. {vet.name}
                          </h6>
                          {vet.vetInfo?.clinicName && (
                            <small className="text-muted text-truncate d-block">
                              {vet.vetInfo.clinicName}
                            </small>
                          )}
                        </div>
                      </div>

                      {/* Specialization */}
                      <div className="mb-2">
                        {(Array.isArray(vet.vetInfo?.specialization)
                          ? vet.vetInfo.specialization
                          : vet.vetInfo?.specialization
                            ? [vet.vetInfo.specialization]
                            : []
                        )
                          .slice(0, 3)
                          .map((s, i) => (
                            <Badge
                              key={i}
                              bg="info"
                              className="me-1 mb-1"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {s}
                            </Badge>
                          ))}
                      </div>

                      {/* Info Row */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        {vet.vetInfo?.experience != null && (
                          <small className="text-muted">
                            <i className="bi bi-briefcase me-1"></i>
                            {vet.vetInfo.experience} yrs exp
                          </small>
                        )}
                        <small className="fw-bold text-primary">
                          ₹{getConsultationFee(vet, "in-clinic")}
                        </small>
                      </div>

                      {/* City */}
                      {(vet.vetInfo?.clinicAddress?.city ||
                        vet.vetInfo?.fullAddress) && (
                        <small className="text-muted d-block text-truncate mb-2">
                          <i className="bi bi-geo me-1"></i>
                          {vet.vetInfo?.clinicAddress?.city ||
                            vet.vetInfo?.fullAddress?.split(",")[0] ||
                            ""}
                          {vet.vetInfo?.clinicAddress?.state
                            ? `, ${vet.vetInfo.clinicAddress.state}`
                            : ""}
                        </small>
                      )}

                      {/* Consultation Modes */}
                      <div className="d-flex gap-1 mt-auto">
                        {(
                          vet.vetInfo?.consultationModes || ["in-clinic"]
                        ).map((mode) => (
                          <Badge
                            key={mode}
                            bg="light"
                            text="dark"
                            className="border"
                            style={{ fontSize: "0.65rem" }}
                          >
                            <i
                              className={`bi ${getModeIcon(mode)} me-1`}
                            ></i>
                            {getModeLabel(mode)}
                          </Badge>
                        ))}
                      </div>

                      {/* Book Button */}
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-100 mt-3 rounded-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVet(vet);
                        }}
                      >
                        <i className="bi bi-calendar-plus me-1"></i> Book
                        Appointment
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      {/* Mobile Filter Drawer */}
      <Offcanvas
        show={showFilters}
        onHide={() => setShowFilters(false)}
        placement="bottom"
        className="h-auto"
        style={{ maxHeight: "70vh" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <i className="bi bi-funnel me-2"></i>Filters
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {customerLocation && (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">
                Distance: {filters.radius} km
              </Form.Label>
              <Form.Range
                min={5}
                max={500}
                step={5}
                value={Math.min(filters.radius, 500)}
                onChange={(e) =>
                  handleFilterChange("radius", parseInt(e.target.value))
                }
              />
              <Form.Control
                type="number"
                size="sm"
                className="mt-2"
                placeholder="Or enter distance in km"
                value={filters.radius}
                min={1}
                max={5000}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) handleFilterChange("radius", val);
                }}
              />
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">
              Specialization
            </Form.Label>
            <Form.Select
              size="sm"
              value={filters.specialization}
              onChange={(e) =>
                handleFilterChange("specialization", e.target.value)
              }
            >
              <option value="">All</option>
              {allSpecializations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Type</Form.Label>
            <Form.Select
              size="sm"
              value={filters.consultationMode}
              onChange={(e) =>
                handleFilterChange("consultationMode", e.target.value)
              }
            >
              <option value="">All</option>
              <option value="in-clinic">In-Clinic</option>
              <option value="home-visit">Home Visit</option>
              <option value="video-consultation">Video Call</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Sort By</Form.Label>
            <Form.Select
              size="sm"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            >
              <option value="distance">Nearest</option>
              <option value="fee">Lowest Fee</option>
              <option value="experience">Most Experienced</option>
            </Form.Select>
          </Form.Group>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              className="flex-grow-1 rounded-pill"
              onClick={() => setShowFilters(false)}
            >
              Apply
            </Button>
            <Button
              variant="outline-secondary"
              className="rounded-pill"
              onClick={() => {
                clearFilters();
                setShowFilters(false);
              }}
            >
              Reset All
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Booking Modal */}
      <Modal
        show={showBookingModal}
        onHide={() => {
          setShowBookingModal(false);
          dispatch(resetAppointments());
        }}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-calendar-plus me-2"></i>Book Appointment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVet && (
            <>
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
                  Appointment booked successfully! Redirecting...
                </Alert>
              )}

              {/* Vet Info Card */}
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col xs="auto">
                      <img
                        src={
                          selectedVet.profileImage || selectedVet.profilePicture
                            ? resolveImageUrl(
                                selectedVet.profileImage ||
                                  selectedVet.profilePicture,
                                "users"
                              )
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
                          if (e.target.src !== DEFAULT_AVATAR)
                            e.target.src = DEFAULT_AVATAR;
                        }}
                      />
                    </Col>
                    <Col>
                      <h6 className="mb-1 fw-bold">
                        Dr. {selectedVet.name}
                      </h6>
                      {selectedVet.vetInfo?.clinicName && (
                        <small className="text-muted d-block">
                          <i className="bi bi-hospital me-1"></i>
                          {selectedVet.vetInfo.clinicName}
                        </small>
                      )}
                      {getFullAddress(selectedVet) && (
                        <small className="text-muted d-block">
                          <i className="bi bi-geo-alt me-1"></i>
                          {getFullAddress(selectedVet)}
                        </small>
                      )}
                      {selectedVet._distance != null && (
                        <Badge
                          bg="success"
                          className="mt-1 rounded-pill"
                        >
                          <i className="bi bi-geo me-1"></i>
                          {selectedVet._distance} km away
                          {selectedVet._duration
                            ? ` · ~${selectedVet._duration} min drive`
                            : ""}
                        </Badge>
                      )}
                    </Col>
                  </Row>

                  {/* Map Preview */}
                  {getVetCoords(selectedVet) && (
                    <div className="mt-3">
                      <MapComponent
                        center={getVetCoords(selectedVet)}
                        zoom={15}
                        markers={[
                          {
                            position: getVetCoords(selectedVet),
                            icon: greenIcon,
                            popup: `${selectedVet.vetInfo?.clinicName || "Clinic"} - Dr. ${selectedVet.name}`,
                          },
                          ...(customerLocation?.lat
                            ? [
                                {
                                  position: [
                                    customerLocation.lat,
                                    customerLocation.lng,
                                  ],
                                  icon: blueIcon,
                                  popup: "📍 Your Location",
                                },
                              ]
                            : []),
                        ]}
                        height="200px"
                      />
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${getVetCoords(selectedVet)[0]},${getVetCoords(selectedVet)[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm rounded-pill mt-2 w-100"
                      >
                        <i className="bi bi-sign-turn-right me-1"></i>
                        Get Directions
                      </a>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Booking Form */}
              <Form onSubmit={handleSubmit}>
                {/* Consultation Mode Selection */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-check2-circle me-1"></i>
                    Consultation Type
                  </Form.Label>
                  <div className="d-flex gap-2 flex-wrap">
                    {(
                      selectedVet.vetInfo?.consultationModes || [
                        "in-clinic",
                      ]
                    ).map((mode) => (
                      <Button
                        key={mode}
                        variant={
                          formData.consultationMode === mode
                            ? "primary"
                            : "outline-secondary"
                        }
                        size="sm"
                        className="rounded-pill"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            consultationMode: mode,
                          }))
                        }
                      >
                        <i
                          className={`bi ${getModeIcon(mode)} me-1`}
                        ></i>
                        {getModeLabel(mode)} — ₹
                        {getConsultationFee(selectedVet, mode)}
                      </Button>
                    ))}
                  </div>
                </Form.Group>

                {/* Pet Info */}
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Pet Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        type="text"
                        name="petName"
                        value={formData.petName}
                        onChange={handleFormChange}
                        placeholder="Pet's name"
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
                        size="sm"
                        name="petType"
                        value={formData.petType}
                        onChange={handleFormChange}
                        isInvalid={!!errors.petType}
                      >
                        <option value="">Select...</option>
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
                        size="sm"
                        type="text"
                        name="petAge"
                        value={formData.petAge}
                        onChange={handleFormChange}
                        placeholder="e.g., 2 years"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Reason */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Reason <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    name="reason"
                    value={formData.reason}
                    onChange={handleFormChange}
                    isInvalid={!!errors.reason}
                  >
                    <option value="">Select reason...</option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.reason}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Date & Time */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Date <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleFormChange}
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
                      {loadingSlots ? (
                        <div className="text-center py-2">
                          <Spinner animation="border" size="sm" />{" "}
                          Loading...
                        </div>
                      ) : (
                        <Form.Select
                          size="sm"
                          name="timeSlot"
                          value={formData.timeSlot}
                          onChange={handleFormChange}
                          isInvalid={!!errors.timeSlot}
                          disabled={!formData.date}
                        >
                          <option value="">Select slot...</option>
                          {availableSlots?.length > 0 ? (
                            availableSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))
                          ) : formData.date ? (
                            <option disabled>No slots available</option>
                          ) : null}
                        </Form.Select>
                      )}
                      <Form.Control.Feedback type="invalid">
                        {errors.timeSlot}
                      </Form.Control.Feedback>
                      {formData.date &&
                        availableSlots?.length === 0 &&
                        !loadingSlots && (
                          <Form.Text className="text-danger">
                            No slots available. Try a different date.
                          </Form.Text>
                        )}
                    </Form.Group>
                  </Col>
                </Row>

                {/* Total Fee Display */}
                <Card className="border-0 bg-light mb-3">
                  <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      <i className="bi bi-receipt me-1"></i>
                      Consultation Fee
                    </span>
                    <span className="fs-5 fw-bold text-primary">
                      ₹
                      {getConsultationFee(
                        selectedVet,
                        formData.consultationMode
                      )}
                    </span>
                  </Card.Body>
                </Card>

                <div className="d-flex gap-2 justify-content-end">
                  <Button
                    variant="outline-secondary"
                    className="rounded-pill"
                    onClick={() => {
                      setShowBookingModal(false);
                      dispatch(resetAppointments());
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="rounded-pill"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-1"
                        />
                        Booking...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-1"></i>Book
                        Appointment
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default BookAppointment;
