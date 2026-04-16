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
import {
  getPet,
  createPet,
  updatePet,
  resetPets,
} from "../../redux/slices/petSlice";
import { PET_SPECIES, PET_SIZES, PET_GENDERS } from "../../utils/constants";
import Loading from "../../components/common/Loading";

const PetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    pet: currentPet,
    isLoading,
    isError,
    isSuccess,
    message,
  } = useSelector((state) => state.pets);

  const isEditMode = Boolean(id);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    ageValue: "",
    ageUnit: "years",
    gender: "",
    size: "",
    color: "",
    description: "",
    medicalHistory: "",
    vaccinated: false,
    status: "available",
    adoptionFee: 0,
  });

  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Reset pet state on mount to clear any previous success state
    dispatch(resetPets());
    setFormSubmitted(false);

    if (isEditMode && id) {
      dispatch(getPet(id));
    }

    // Cleanup on unmount
    return () => {
      dispatch(resetPets());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentPet) {
      setFormData({
        name: currentPet.name || "",
        species: currentPet.species || "",
        breed: currentPet.breed || "",
        ageValue: currentPet.age?.value || "",
        ageUnit: currentPet.age?.unit || "years",
        gender: currentPet.gender || "",
        size: currentPet.size || "",
        color: currentPet.color || "",
        description: currentPet.description || "",
        medicalHistory: currentPet.healthInfo?.specialNeedsDescription || "",
        vaccinated: currentPet.healthInfo?.vaccinated || false,
        status: currentPet.status || "available",
        adoptionFee: currentPet.adoptionFee || 0,
      });
    }
  }, [currentPet, isEditMode]);

  useEffect(() => {
    // Only redirect if form was submitted AND operation was successful
    if (formSubmitted && isSuccess) {
      setTimeout(() => {
        navigate("/admin/pets");
      }, 1500);
    }
  }, [formSubmitted, isSuccess, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.species) {
      newErrors.species = "Species is required";
    }

    if (!formData.breed) {
      newErrors.breed = "Breed is required";
    }

    if (!formData.ageValue || formData.ageValue < 0) {
      newErrors.ageValue = "Valid age is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.size) {
      newErrors.size = "Size is required";
    }

    if (!formData.color || formData.color.trim().length < 1) {
      newErrors.color = "Color is required";
    }

    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    // Require image for new pets
    if (!isEditMode && images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const petData = new FormData();

    // Add basic fields
    petData.append("name", formData.name);
    petData.append("species", formData.species);
    petData.append("breed", formData.breed);
    petData.append("gender", formData.gender);
    petData.append("size", formData.size);
    petData.append("color", formData.color);
    petData.append("description", formData.description);
    petData.append("status", formData.status);
    petData.append("adoptionFee", formData.adoptionFee);

    // Add age as nested object fields
    petData.append("age[value]", formData.ageValue);
    petData.append("age[unit]", formData.ageUnit);

    // Add health info
    petData.append("healthInfo[vaccinated]", formData.vaccinated);
    if (formData.medicalHistory) {
      petData.append(
        "healthInfo[specialNeedsDescription]",
        formData.medicalHistory
      );
    }

    // Add images
    images.forEach((image) => {
      petData.append("images", image);
    });

    // Mark form as submitted before dispatching
    setFormSubmitted(true);

    if (isEditMode) {
      dispatch(updatePet({ id, petData }));
    } else {
      dispatch(createPet(petData));
    }
  };

  if (isLoading && isEditMode) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="fw-bold mb-4">
                {isEditMode ? "Edit Pet" : "Add New Pet"}
              </h3>

              {isError && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => dispatch(resetPets())}
                >
                  {message}
                </Alert>
              )}

              {formSubmitted && isSuccess && (
                <Alert variant="success">
                  Pet {isEditMode ? "updated" : "created"} successfully!
                  Redirecting...
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
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter pet name"
                        isInvalid={!!errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Species <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="species"
                        value={formData.species}
                        onChange={handleChange}
                        isInvalid={!!errors.species}
                      >
                        <option value="">Select species...</option>
                        {PET_SPECIES.map((species) => (
                          <option key={species} value={species}>
                            {species.charAt(0).toUpperCase() + species.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.species}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Breed <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="breed"
                        value={formData.breed}
                        onChange={handleChange}
                        placeholder="Enter breed"
                        isInvalid={!!errors.breed}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.breed}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Age <span className="text-danger">*</span>
                      </Form.Label>
                      <Row>
                        <Col xs={6}>
                          <Form.Control
                            type="number"
                            name="ageValue"
                            value={formData.ageValue}
                            onChange={handleChange}
                            min="0"
                            step="1"
                            placeholder="Age"
                            isInvalid={!!errors.ageValue}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.ageValue}
                          </Form.Control.Feedback>
                        </Col>
                        <Col xs={6}>
                          <Form.Select
                            name="ageUnit"
                            value={formData.ageUnit}
                            onChange={handleChange}
                          >
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                          </Form.Select>
                        </Col>
                      </Row>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Gender <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        isInvalid={!!errors.gender}
                      >
                        <option value="">Select...</option>
                        {PET_GENDERS.map((gender) => (
                          <option key={gender} value={gender}>
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.gender}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Size <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="size"
                        value={formData.size}
                        onChange={handleChange}
                        isInvalid={!!errors.size}
                      >
                        <option value="">Select...</option>
                        {PET_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.size}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Color <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        placeholder="Enter color"
                        isInvalid={!!errors.color}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.color}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="adopted">Adopted</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Adoption Fee (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        name="adoptionFee"
                        value={formData.adoptionFee}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="vaccinated"
                        label="Vaccinated"
                        checked={formData.vaccinated}
                        onChange={handleChange}
                        className="mt-4"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the pet's personality, behavior, and special needs..."
                    isInvalid={!!errors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Medical History</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Any medical conditions, medications, or health notes..."
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Pet Images{" "}
                    {!isEditMode && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    isInvalid={!!errors.images}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.images}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    {isEditMode
                      ? "Upload new images to replace existing ones. First image will be the main photo."
                      : "Select at least one image. First image will be the main photo."}
                  </Form.Text>
                  {images.length > 0 && (
                    <div className="mt-2 text-success">
                      <small>{images.length} image(s) selected</small>
                    </div>
                  )}
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading
                      ? "Saving..."
                      : isEditMode
                      ? "Update Pet"
                      : "Add Pet"}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/admin/pets")}
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

export default PetForm;
