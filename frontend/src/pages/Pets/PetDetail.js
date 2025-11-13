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
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getPet, resetPets } from "../../redux/slices/petSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";
import { formatDate } from "../../utils/formatters";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
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
    return () => dispatch(resetPets());
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
    if (!img) return "/images/default-pet.jpg";
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

  if (isLoading) {
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
        className="mb-3"
        onClick={() => navigate("/pets")}
      >
        ← Back to All Pets
      </Button>

      <Row>
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Img
              variant="top"
              src={getImageUrl(pet.mainImage || pet.images?.[0])}
              alt={pet.name}
              style={{ height: "400px", objectFit: "cover" }}
              onError={(e) => {
                e.target.src = "/images/default-pet.jpg";
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
                      e.target.src = "/images/default-pet.jpg";
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col lg={6}>
          <div className="mb-3">
            <Badge bg={getStatusVariant(petStatus)} className="mb-2">
              {petStatus.toUpperCase()}
            </Badge>
            <h2 className="fw-bold mb-3">{pet.name}</h2>
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

          <Card className="bg-light border-0 mb-4">
            <Card.Body>
              <h5 className="fw-bold mb-2">About {pet.name}</h5>
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

          {petStatus === "available" && (
            <div className="d-grid gap-2">
              <Button variant="primary" size="lg" onClick={handleAdoptClick}>
                Apply for Adoption
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
