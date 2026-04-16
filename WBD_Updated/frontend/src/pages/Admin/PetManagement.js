import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { getPets, deletePet, resetPets, getMyPets } from "../../redux/slices/petSlice";
import useAuth from "../../hooks/useAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PetManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine URL prefix based on role
  const isOrg = user?.role === "organization";
  const basePath = isOrg ? "/organization" : "/admin";
  const { pets, isLoading, isError, isSuccess, message, pagination } =
    useSelector((state) => state.pets);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [selectedPet, setSelectedPet] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (isOrg) {
      dispatch(getMyPets());
    } else {
      dispatch(getPets({}));
    }
  }, [dispatch, isOrg]);

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
          <Button variant="outline-secondary" size="sm" onClick={() => navigate(isOrg ? "/organization/dashboard" : "/admin")} className="mb-2">
            <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
          </Button>
          <h2 className="mb-1">Pet Management</h2>
          <p className="text-muted mb-0">
            Manage all pets available for adoption
          </p>
        </div>
        {user?.role !== "admin" && user?.role !== "co-admin" && (
          <Link to={`${basePath}/pets/new`} className="btn btn-primary rounded-pill">
            <i className="bi bi-plus-circle me-2"></i>Add New Pet
          </Link>
        )}
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
          <Card className="text-center border-0 shadow-sm bg-success bg-opacity-10">
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
          <Card className="text-center border-0 shadow-sm bg-warning bg-opacity-10">
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
          <Card className="text-center border-0 shadow-sm bg-info bg-opacity-10">
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
          <Card className="text-center border-0 shadow-sm bg-primary bg-opacity-10">
            <Card.Body>
              <h3>{pets.length}</h3>
              <small className="text-muted">Total Pets</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
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
                          to={`${basePath}/pets/${pet._id}/edit`}
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
                  className="mb-3"
                />
                {/* Additional images */}
                {selectedPet.images?.length > 0 && (
                  <div className="d-flex flex-wrap gap-1">
                    {selectedPet.images.map((img, i) => (
                      <Image
                        key={i}
                        src={`${API_URL}/uploads/pets/${img}`}
                        width={60}
                        height={60}
                        style={{ objectFit: "cover" }}
                        rounded
                      />
                    ))}
                  </div>
                )}
              </Col>
              <Col md={8}>
                <h4 className="mb-3">{selectedPet.name}</h4>

                <Row className="g-2 mb-3">
                  <Col xs={6}><strong>Species:</strong> <span className="text-capitalize">{selectedPet.species}</span></Col>
                  <Col xs={6}><strong>Breed:</strong> {selectedPet.breed || "N/A"}</Col>
                  <Col xs={6}><strong>Age:</strong> {selectedPet.age?.value ? `${selectedPet.age.value} ${selectedPet.age.unit}` : "N/A"}</Col>
                  <Col xs={6}><strong>Gender:</strong> <span className="text-capitalize">{selectedPet.gender}</span></Col>
                  <Col xs={6}><strong>Size:</strong> <span className="text-capitalize">{selectedPet.size}</span></Col>
                  <Col xs={6}><strong>Color:</strong> {selectedPet.color || "N/A"}</Col>
                  <Col xs={6}><strong>Status:</strong> {getStatusBadge(selectedPet.status || selectedPet.adoptionStatus)}</Col>
                  <Col xs={6}><strong>Adoption Fee:</strong> {selectedPet.adoptionFee > 0 ? `₹${selectedPet.adoptionFee}` : "Free"}</Col>
                </Row>

                {selectedPet.description && (
                  <div className="mb-3">
                    <strong>Description:</strong>
                    <p className="text-muted mt-1 mb-0">{selectedPet.description}</p>
                  </div>
                )}

                {/* Health Info */}
                {selectedPet.healthInfo && (
                  <div className="mb-3">
                    <strong>Health Info:</strong>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {selectedPet.healthInfo.vaccinated && <Badge bg="success">Vaccinated</Badge>}
                      {selectedPet.healthInfo.neutered && <Badge bg="info">Neutered</Badge>}
                      {selectedPet.healthInfo.microchipped && <Badge bg="primary">Microchipped</Badge>}
                      {selectedPet.healthInfo.specialNeeds && <Badge bg="warning" text="dark">Special Needs</Badge>}
                      {!selectedPet.healthInfo.vaccinated && !selectedPet.healthInfo.neutered &&
                       !selectedPet.healthInfo.microchipped && !selectedPet.healthInfo.specialNeeds && (
                        <span className="text-muted small">No health records</span>
                      )}
                    </div>
                    {selectedPet.healthInfo.specialNeedsDescription && (
                      <p className="text-muted small mt-1 mb-0">{selectedPet.healthInfo.specialNeedsDescription}</p>
                    )}
                  </div>
                )}

                {/* Good With */}
                {selectedPet.goodWith && (
                  <div className="mb-3">
                    <strong>Good With:</strong>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {selectedPet.goodWith.children && <Badge bg="success">Children</Badge>}
                      {selectedPet.goodWith.dogs && <Badge bg="success">Dogs</Badge>}
                      {selectedPet.goodWith.cats && <Badge bg="success">Cats</Badge>}
                      {selectedPet.goodWith.otherAnimals && <Badge bg="success">Other Animals</Badge>}
                      {!selectedPet.goodWith.children && !selectedPet.goodWith.dogs &&
                       !selectedPet.goodWith.cats && !selectedPet.goodWith.otherAnimals && (
                        <span className="text-muted small">Not specified</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Behavior */}
                {selectedPet.behavior && (
                  <Row className="g-2 mb-3">
                    <Col xs={4}><strong className="small">Energy:</strong> <span className="text-capitalize small">{selectedPet.behavior.energyLevel || "N/A"}</span></Col>
                    <Col xs={4}><strong className="small">Training:</strong> <span className="text-capitalize small">{selectedPet.behavior.trainingLevel || "N/A"}</span></Col>
                    <Col xs={4}><strong className="small">Social:</strong> <span className="text-capitalize small">{selectedPet.behavior.socialness || "N/A"}</span></Col>
                  </Row>
                )}

                <small className="text-muted">
                  <strong>Added:</strong> {formatDate(selectedPet.createdAt)}
                </small>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          <Link
            to={`${basePath}/pets/${selectedPet?._id}/edit`}
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
