import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const PetCard = ({ pet }) => {
  const {
    _id,
    name,
    species,
    breed,
    age,
    gender,
    size,
    image,
    adoptionStatus,
  } = pet;

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

  return (
    <Card className="h-100 pet-card shadow-sm">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={image || "/images/default-pet.jpg"}
          alt={`${name}, a ${species} looking for adoption`}
          style={{ height: "250px", objectFit: "cover" }}
          loading="lazy"
        />
        <div className="position-absolute top-0 end-0 m-2">
          <Badge
            bg={getStatusVariant(adoptionStatus)}
            className="px-3 py-2 text-uppercase"
          >
            {adoptionStatus}
          </Badge>
        </div>
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="mb-2 h5">{name}</Card.Title>

        <Card.Text className="text-muted mb-3">
          <i className="bi bi-tag me-1"></i>
          {species} • {breed}
        </Card.Text>

        <div className="mb-3 small">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">
              <i className="bi bi-calendar3 me-1"></i>Age:
            </span>
            <span className="fw-semibold">{age}</span>
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
