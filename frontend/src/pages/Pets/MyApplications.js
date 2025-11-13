import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "../../api/axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/pets/applications/my");
      setApplications(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      under_review: "info",
      approved: "success",
      rejected: "danger",
      withdrawn: "secondary",
    };
    return (
      <Badge bg={variants[status] || "secondary"}>
        {status?.replace("_", " ")}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getImageUrl = (image) => {
    if (!image) return "/images/default-pet.jpg";
    if (image.startsWith("http")) return image;
    return `${API_URL}/uploads/pets/${image}`;
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading your applications...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">My Adoption Applications</h2>
          <p className="text-muted mb-0">
            Track the status of your pet adoption applications
          </p>
        </div>
        <Link to="/pets" className="btn btn-primary">
          <i className="bi bi-heart me-2"></i>Browse Pets
        </Link>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-primary bg-opacity-10">
            <Card.Body>
              <h3>{applications.length}</h3>
              <small className="text-muted">Total Applications</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning bg-opacity-10">
            <Card.Body>
              <h3>
                {
                  applications.filter(
                    (a) => a.status === "pending" || a.status === "under_review"
                  ).length
                }
              </h3>
              <small className="text-muted">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success bg-opacity-10">
            <Card.Body>
              <h3>
                {applications.filter((a) => a.status === "approved").length}
              </h3>
              <small className="text-muted">Approved</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-danger bg-opacity-10">
            <Card.Body>
              <h3>
                {applications.filter((a) => a.status === "rejected").length}
              </h3>
              <small className="text-muted">Rejected</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {applications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-heart display-1 text-muted"></i>
              <h4 className="mt-3">No Applications Yet</h4>
              <p className="text-muted mb-4">
                You haven't applied to adopt any pets yet. Browse our available
                pets and find your perfect companion!
              </p>
              <Link to="/pets" className="btn btn-primary btn-lg">
                <i className="bi bi-search me-2"></i>Find a Pet
              </Link>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Pet</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={getImageUrl(application.pet?.mainImage)}
                          alt={application.pet?.name}
                          className="rounded me-3"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.src = "/images/default-pet.jpg";
                          }}
                        />
                        <div>
                          <strong>
                            {application.pet?.name || "Unknown Pet"}
                          </strong>
                          <br />
                          <small className="text-muted">
                            {application.pet?.breed} •{" "}
                            {application.pet?.species}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(application.createdAt)}</td>
                    <td>{getStatusBadge(application.status)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewDetails(application)}
                      >
                        <i className="bi bi-eye me-1"></i>View Details
                      </Button>
                      {application.pet && (
                        <Link
                          to={`/pets/${application.pet._id}`}
                          className="btn btn-outline-secondary btn-sm"
                        >
                          <i className="bi bi-heart me-1"></i>View Pet
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Application Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Application Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApplication && (
            <div>
              <Row className="mb-4">
                <Col md={4}>
                  <img
                    src={getImageUrl(selectedApplication.pet?.mainImage)}
                    alt={selectedApplication.pet?.name}
                    className="img-fluid rounded"
                    onError={(e) => {
                      e.target.src = "/images/default-pet.jpg";
                    }}
                  />
                </Col>
                <Col md={8}>
                  <h4>{selectedApplication.pet?.name}</h4>
                  <p className="text-muted">
                    {selectedApplication.pet?.breed} •{" "}
                    {selectedApplication.pet?.species}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {getStatusBadge(selectedApplication.status)}
                  </p>
                  <p>
                    <strong>Applied On:</strong>{" "}
                    {formatDate(selectedApplication.createdAt)}
                  </p>
                </Col>
              </Row>

              <hr />

              <h6>Application Information</h6>
              {selectedApplication.livingSituation && (
                <Row className="mb-3">
                  <Col md={6}>
                    <p>
                      <strong>Home Type:</strong>{" "}
                      {selectedApplication.livingSituation.homeType}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <strong>Has Yard:</strong>{" "}
                      {selectedApplication.livingSituation.hasYard
                        ? "Yes"
                        : "No"}
                    </p>
                  </Col>
                </Row>
              )}

              {selectedApplication.petExperience && (
                <div className="mb-3">
                  <p>
                    <strong>Pet Experience:</strong>{" "}
                    {selectedApplication.petExperience.petCareExperience}
                  </p>
                </div>
              )}

              {selectedApplication.additionalInfo?.whyAdopt && (
                <div className="mb-3">
                  <p>
                    <strong>Reason for Adoption:</strong>{" "}
                    {selectedApplication.additionalInfo.whyAdopt}
                  </p>
                </div>
              )}

              {selectedApplication.status === "rejected" &&
                selectedApplication.rejectionReason && (
                  <Alert variant="danger">
                    <strong>Rejection Reason:</strong>{" "}
                    {selectedApplication.rejectionReason}
                  </Alert>
                )}

              {selectedApplication.status === "approved" && (
                <Alert variant="success">
                  <strong>Congratulations!</strong> Your application has been
                  approved. The shelter will contact you shortly with next
                  steps.
                </Alert>
              )}

              {(selectedApplication.status === "pending" ||
                selectedApplication.status === "under_review") && (
                <Alert variant="info">
                  <strong>Application Under Review</strong> - Your application
                  is being reviewed. We'll notify you once a decision is made.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyApplications;
