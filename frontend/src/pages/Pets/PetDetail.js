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
              src={pet.images?.[0] || "/images/placeholder-pet.png"}
              alt={pet.name}
              style={{ height: "400px", objectFit: "cover" }}
            />
            {pet.images && pet.images.length > 1 && (
              <div className="d-flex gap-2 p-2">
                {pet.images.slice(1, 5).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${pet.name} ${idx + 2}`}
                    className="rounded"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col lg={6}>
          <div className="mb-3">
            <Badge bg={getStatusVariant(pet.adoptionStatus)} className="mb-2">
              {pet.adoptionStatus?.toUpperCase()}
            </Badge>
            <h2 className="fw-bold mb-3">{pet.name}</h2>
            <p className="text-muted lead">{pet.breed}</p>
          </div>

          <ListGroup variant="flush" className="mb-4">
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Species:</span>
              <span>{pet.species}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Age:</span>
              <span>
                {pet.age} {pet.age === 1 ? "year" : "years"}
              </span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Gender:</span>
              <span>{pet.gender}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Size:</span>
              <span>{pet.size}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Color:</span>
              <span>{pet.color}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Vaccinated:</span>
              <span>{pet.vaccinated ? "✓ Yes" : "✗ No"}</span>
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

          {pet.medicalHistory && (
            <Card className="bg-light border-0 mb-4">
              <Card.Body>
                <h5 className="fw-bold mb-2">Medical History</h5>
                <p className="mb-0">{pet.medicalHistory}</p>
              </Card.Body>
            </Card>
          )}

          {pet.adoptionStatus === "available" && (
            <div className="d-grid gap-2">
              <Button variant="primary" size="lg" onClick={handleAdoptClick}>
                Apply for Adoption
              </Button>
            </div>
          )}

          {pet.adoptionStatus === "pending" && (
            <div className="alert alert-warning" role="alert">
              This pet has a pending adoption application
            </div>
          )}

          {pet.adoptionStatus === "adopted" && (
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
