import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const PetCard = ({ pet }) => {
  const { _id, name, species, breed, age, gender, size, mainImage, status } =
    pet;

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
    if (typeof ageObj === "object") {
      return `${ageObj.value} ${ageObj.unit}`;
    }
    return ageObj;
  };

  // Get image URL
  const getImageUrl = () => {
    if (!mainImage) return "/images/default-pet.jpg";
    if (mainImage.startsWith("http")) return mainImage;
    return `${API_URL}/uploads/pets/${mainImage}`;
  };

  return (
    <Card className="h-100 pet-card shadow-sm">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={getImageUrl()}
          alt={`${name}, a ${species} looking for adoption`}
          style={{ height: "250px", objectFit: "cover" }}
          loading="lazy"
          onError={(e) => {
            e.target.src = "/images/default-pet.jpg";
          }}
        />
        <div className="position-absolute top-0 end-0 m-2">
          <Badge
            bg={getStatusVariant(status)}
            className="px-3 py-2 text-uppercase"
          >
            {status || "available"}
          </Badge>
        </div>
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="mb-2 h5">{name}</Card.Title>

        <Card.Text className="text-muted mb-3">
          <i className="bi bi-tag me-1"></i>
          {species} {breed ? `• ${breed}` : ""}
        </Card.Text>

        <div className="mb-3 small">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">
              <i className="bi bi-calendar3 me-1"></i>Age:
            </span>
            <span className="fw-semibold">{formatAge(age)}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">
              <i className="bi bi-gender-ambiguous me-1"></i>Gender:
            </span>
            <span className="fw-semibold">{gender}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted">
              <i className="bi bi-rulers me-1"></i>Size:
            </span>
            <span className="fw-semibold">{size}</span>
          </div>
        </div>

        <div className="mt-auto">
          <Link to={`/pets/${_id}`}>
            <Button
              variant="primary"
              className="w-100"
              aria-label={`View details about ${name}`}
            >
              <i className="bi bi-info-circle me-2"></i>View Details
            </Button>
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
