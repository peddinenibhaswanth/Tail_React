import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Modal,
  Spinner,
  Alert,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { getPets, deletePet, resetPets } from "../../redux/slices/petSlice";
import useAuth from "../../hooks/useAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const PetManagement = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { pets, isLoading, isError, isSuccess, message, pagination } =
    useSelector((state) => state.pets);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [selectedPet, setSelectedPet] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    dispatch(getPets({}));
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && message?.includes("deleted")) {
      setShowDeleteModal(false);
      dispatch(resetPets());
    }
  }, [isSuccess, message, dispatch]);

  const handleDelete = (pet) => {
    setSelectedPet(pet);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedPet) {
      dispatch(deletePet(selectedPet._id));
    }
  };

  const handleViewDetails = (pet) => {
    setSelectedPet(pet);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: "success",
      adopted: "info",
      pending: "warning",
      unavailable: "secondary",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    const petStatus = pet.adoptionStatus || pet.status;
    const matchesStatus = statusFilter === "all" || petStatus === statusFilter;
    const matchesSpecies =
      speciesFilter === "all" || pet.species === speciesFilter;
    return matchesSearch && matchesStatus && matchesSpecies;
  });

  const uniqueSpecies = [...new Set(pets.map((pet) => pet.species))];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Pet Management</h2>
          <p className="text-muted mb-0">
            Manage all pets available for adoption
          </p>
        </div>
        <Link to="/pets/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Add New Pet
        </Link>
      </div>

      {isError && (
        <Alert variant="danger" dismissible>
          {message}
        </Alert>
      )}
      {isSuccess && message && (
        <Alert variant="success" dismissible>
          {message}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-success bg-opacity-10">
            <Card.Body>
              <h3>
                {
                  pets.filter(
                    (p) => (p.adoptionStatus || p.status) === "available"
                  ).length
                }
              </h3>
              <small className="text-muted">Available</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning bg-opacity-10">
            <Card.Body>
              <h3>
                {
                  pets.filter(
                    (p) => (p.adoptionStatus || p.status) === "pending"
                  ).length
                }
              </h3>
              <small className="text-muted">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-info bg-opacity-10">
            <Card.Body>
              <h3>
                {
                  pets.filter(
                    (p) => (p.adoptionStatus || p.status) === "adopted"
                  ).length
                }
              </h3>
              <small className="text-muted">Adopted</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-primary bg-opacity-10">
            <Card.Body>
              <h3>{pets.length}</h3>
              <small className="text-muted">Total Pets</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Form.Control
              type="text"
              placeholder="Search by name or breed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "300px" }}
            />
            <div className="d-flex gap-2">
              <Form.Select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                style={{ maxWidth: "150px" }}
              >
                <option value="all">All Species</option>
                {uniqueSpecies.map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </Form.Select>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ maxWidth: "150px" }}
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="adopted">Adopted</option>
                <option value="unavailable">Unavailable</option>
              </Form.Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading pets...</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-search fs-1 d-block mb-3"></i>
              <p>No pets found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Species</th>
                    <th>Breed</th>
                    <th>Age</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPets.map((pet) => (
                    <tr key={pet._id}>
                      <td>
                        <Image
                          src={
                            pet.mainImage
                              ? `${API_URL}/uploads/pets/${pet.mainImage}`
                              : "/placeholder-pet.png"
                          }
                          alt={pet.name}
                          width={50}
                          height={50}
                          style={{ objectFit: "cover" }}
                          rounded
                        />
                      </td>
                      <td>
                        <strong>{pet.name}</strong>
                        <br />
                        <small className="text-muted">{pet.gender}</small>
                      </td>
                      <td>{pet.species}</td>
                      <td>{pet.breed}</td>
                      <td>
                        {pet.age?.value
                          ? `${pet.age.value} ${pet.age.unit}`
                          : "N/A"}
                      </td>
                      <td>
                        {getStatusBadge(pet.adoptionStatus || pet.status)}
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                          onClick={() => handleViewDetails(pet)}
                        >
                          View
                        </Button>
                        <Link
                          to={`/pets/${pet._id}/edit`}
                          className="btn btn-outline-primary btn-sm me-1"
                        >
                          Edit
                        </Link>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(pet)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pet Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Pet Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPet && (
            <Row>
              <Col md={4}>
                <Image
                  src={
                    selectedPet.mainImage
                      ? `${API_URL}/uploads/pets/${selectedPet.mainImage}`
                      : "/placeholder-pet.png"
                  }
                  alt={selectedPet.name}
                  fluid
                  rounded
                />
              </Col>
              <Col md={8}>
                <h4>{selectedPet.name}</h4>
                <p>
                  <strong>Species:</strong> {selectedPet.species}
                </p>
                <p>
                  <strong>Breed:</strong> {selectedPet.breed}
                </p>
                <p>
                  <strong>Age:</strong>{" "}
                  {selectedPet.age?.value
                    ? `${selectedPet.age.value} ${selectedPet.age.unit}`
                    : "N/A"}
                </p>
                <p>
                  <strong>Gender:</strong> {selectedPet.gender}
                </p>
                <p>
                  <strong>Size:</strong> {selectedPet.size}
                </p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(selectedPet.status)}
                </p>
                <p>
                  <strong>Description:</strong> {selectedPet.description}
                </p>
                {selectedPet.healthInfo && (
                  <p>
                    <strong>Health Info:</strong> {selectedPet.healthInfo}
                  </p>
                )}
                <p>
                  <strong>Added:</strong> {formatDate(selectedPet.createdAt)}
                </p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          <Link
            to={`/pets/${selectedPet?._id}/edit`}
            className="btn btn-primary"
          >
            Edit Pet
          </Link>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete <strong>{selectedPet?.name}</strong>
            ?
          </p>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Pet"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PetManagement;
