import React, { useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  ListGroup,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getPet } from "../../redux/slices/petSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";
import { formatDate } from "../../utils/formatters";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Inline SVG placeholder to prevent infinite error loops
const DEFAULT_PET_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='250' viewBox='0 0 300 250'%3E%3Crect fill='%23f0f0f0' width='300' height='250'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E🐾 No Image%3C/text%3E%3C/svg%3E";

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const isCustomer = !user || user.role === "customer";
  const {
    pet: currentPet,
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.pets);

  useEffect(() => {
    if (id) {
      dispatch(getPet(id));
    }
  }, [dispatch, id]);

  const getStatusVariant = (status) => {
    switch (status) {
      case "available":
        return "success";
      case "pending":
        return "warning";
      case "adopted":
        return "secondary";
      default:
        return "info";
    }
  };

  // Format age display
  const formatAge = (ageObj) => {
    if (!ageObj) return "Unknown";
    if (typeof ageObj === "object" && ageObj.value !== undefined) {
      return `${ageObj.value} ${ageObj.unit || "months"}`;
    }
    return `${ageObj} years`;
  };

  // Get image URL
  const getImageUrl = (img) => {
    if (!img) return DEFAULT_PET_IMAGE;
    if (img.startsWith("http")) return img;
    return `${API_URL}/uploads/pets/${img}`;
  };

  const handleAdoptClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/pets/${id}` } });
    } else {
      navigate(`/pets/${id}/apply`);
    }
  };

  if (isLoading && !currentPet) {
    return <Loading />;
  }

  if (isError) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {message || "Error loading pet details"}
        </div>
        <Button variant="primary" onClick={() => navigate("/pets")}>
          Back to Pets
        </Button>
      </Container>
    );
  }

  if (!currentPet) {
    return (
      <Container className="py-5">
        <div className="alert alert-warning" role="alert">
          Pet not found
        </div>
        <Button variant="primary" onClick={() => navigate("/pets")}>
          Back to Pets
        </Button>
      </Container>
    );
  }

  const pet = currentPet;
  const petStatus = pet.status || pet.adoptionStatus || "available";

  return (
    <Container className="py-4">
      <Button
        variant="outline-secondary"
        className="mb-3 rounded-pill px-3"
        onClick={() => navigate("/pets")}
      >
        <i className="bi bi-arrow-left me-1"></i>Back to All Pets
      </Button>

      <Row>
        <Col lg={6}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <Card.Img
              variant="top"
              src={getImageUrl(pet.mainImage || pet.images?.[0])}
              alt={pet.name}
              style={{ height: "400px", objectFit: "cover" }}
              onError={(e) => {
                if (e.target.src !== DEFAULT_PET_IMAGE) {
                  e.target.src = DEFAULT_PET_IMAGE;
                }
              }}
            />
            {pet.images && pet.images.length > 1 && (
              <div className="d-flex gap-2 p-2">
                {pet.images.slice(1, 5).map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`${pet.name} ${idx + 2}`}
                    className="rounded"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onError={(e) => {
                      if (e.target.src !== DEFAULT_PET_IMAGE) {
                        e.target.src = DEFAULT_PET_IMAGE;
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col lg={6}>
          <div className="mb-3">
            <Badge bg={getStatusVariant(petStatus)} className="mb-2 rounded-pill px-3 py-2 text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
              {petStatus.toUpperCase()}
            </Badge>
            <h2 className="fw-bold mb-2">{pet.name}</h2>
            <p className="text-muted lead">{pet.breed}</p>
          </div>

          <ListGroup variant="flush" className="mb-4">
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Species:</span>
              <span className="text-capitalize">{pet.species}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Age:</span>
              <span>{formatAge(pet.age)}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Gender:</span>
              <span className="text-capitalize">{pet.gender}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Size:</span>
              <span className="text-capitalize">{pet.size}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Color:</span>
              <span>{pet.color}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Vaccinated:</span>
              <span>{pet.healthInfo?.vaccinated ? "✓ Yes" : "✗ No"}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Available Since:</span>
              <span>{formatDate(pet.createdAt)}</span>
            </ListGroup.Item>
          </ListGroup>

          <Card className="border-0 shadow-sm mb-4" style={{ backgroundColor: 'var(--neutral-50)' }}>
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-2"><i className="bi bi-info-circle me-2 text-primary"></i>About {pet.name}</h5>
              <p className="mb-0">
                {pet.description || "No description available."}
              </p>
            </Card.Body>
          </Card>

          {pet.healthInfo?.specialNeeds &&
            pet.healthInfo?.specialNeedsDescription && (
              <Card className="bg-light border-0 mb-4">
                <Card.Body>
                  <h5 className="fw-bold mb-2">Special Needs</h5>
                  <p className="mb-0">
                    {pet.healthInfo.specialNeedsDescription}
                  </p>
                </Card.Body>
              </Card>
            )}

          {petStatus === "available" && isCustomer && (
            <div className="d-grid gap-2">
              <Button variant="primary" size="lg" onClick={handleAdoptClick} className="rounded-pill fw-semibold py-3">
                <i className="bi bi-heart-fill me-2"></i>Apply for Adoption
              </Button>
            </div>
          )}

          {petStatus === "pending" && (
            <div className="alert alert-warning" role="alert">
              This pet has a pending adoption application
            </div>
          )}

          {petStatus === "adopted" && (
            <div className="alert alert-info" role="alert">
              This pet has already been adopted
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PetDetail;
