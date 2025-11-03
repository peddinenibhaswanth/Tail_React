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
    <Card className="h-100 pet-card">
      <Card.Img
        variant="top"
        src={image || "/images/default-pet.jpg"}
        alt={name}
        style={{ height: "250px", objectFit: "cover" }}
      />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0">{name}</Card.Title>
          <Badge bg={getStatusVariant(adoptionStatus)}>{adoptionStatus}</Badge>
        </div>

        <Card.Text className="text-muted mb-2">
          <small>
            {species} • {breed}
          </small>
        </Card.Text>

        <div className="mb-3">
          <span className="me-3">
            <strong>Age:</strong> {age}
          </span>
          <span className="me-3">
            <strong>Gender:</strong> {gender}
          </span>
          <span>
            <strong>Size:</strong> {size}
          </span>
        </div>

        <div className="mt-auto">
          <Link to={`/pets/${_id}`}>
            <Button variant="primary" className="w-100">
              View Details
            </Button>
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
