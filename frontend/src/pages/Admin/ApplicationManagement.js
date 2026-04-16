import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllApplications,
  updateApplicationStatus,
  resetAdmin,
} from "../../redux/slices/adminSlice";
import useAuth from "../../hooks/useAuth";

const ApplicationManagement = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { applications, isLoading, isError, isSuccess, errorMessage } =
    useSelector((state) => state.admin);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  useEffect(() => {
    dispatch(getAllApplications());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      setShowStatusModal(false);
      setStatusReason("");
      // Refresh applications to get updated data
      dispatch(getAllApplications());
      dispatch(resetAdmin());
    }
  }, [isSuccess, dispatch]);

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const handleStatusChange = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = () => {
    if (selectedApplication && newStatus) {
      dispatch(
        updateApplicationStatus({
          id: selectedApplication._id,
          status: newStatus,
          reason: statusReason,
        })
      );
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      under_review: "info",
      reviewing: "info",
      approved: "success",
      rejected: "danger",
      withdrawn: "secondary",
    };
    const displayStatus = status === "under_review" ? "Under Review" : status;
    return <Badge bg={variants[status] || "secondary"}>{displayStatus}</Badge>;
  };

  // Helper to check if status is finalized
  const isStatusFinalized = (status) => {
    return ["approved", "rejected"].includes(status);
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.applicant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.pet?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app._id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h2 className="mb-1">Adoption Applications</h2>
          <p className="text-muted mb-0">
            Review and manage pet adoption requests
          </p>
        </div>
        <Badge bg="primary" className="fs-6">
          Total: {applications.length} applications
        </Badge>
      </div>

      {isError && (
        <Alert variant="danger" dismissible>
          {errorMessage}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-warning bg-opacity-10">
            <Card.Body>
              <h3>
                {applications.filter((a) => a.status === "pending").length}
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
                  applications.filter(
                    (a) =>
                      a.status === "reviewing" || a.status === "under_review"
                  ).length
                }
              </h3>
              <small className="text-muted">Under Review</small>
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

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Form.Control
              type="text"
              placeholder="Search by applicant name, pet name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: "200px" }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </Form.Select>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
              <p>No applications found</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant</th>
                  <th>Pet Name</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application._id}>
                    <td>
                      <small className="text-muted">
                        {application._id?.slice(-8)}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {application.applicant?.name ||
                          application.personalInfo?.fullName ||
                          "N/A"}
                      </strong>
                      <br />
                      <small className="text-muted">
                        {application.applicant?.email || "N/A"}
                      </small>
                    </td>
                    <td>
                      {application.pet?.name || "N/A"}
                      <br />
                      <small className="text-muted">
                        {application.pet?.breed} - {application.pet?.species}
                      </small>
                    </td>
                    <td>{getStatusBadge(application.status)}</td>
                    <td>{formatDate(application.createdAt)}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1"
                        onClick={() => handleViewDetails(application)}
                      >
                        View
                      </Button>
                      {!["approved", "rejected"].includes(
                        application.status
                      ) && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleStatusChange(application)}
                        >
                          Update Status
                        </Button>
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
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Application Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApplication && (
            <div>
              <Row>
                <Col md={6}>
                  <h6>Applicant Information</h6>
                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedApplication.applicant?.name ||
                      selectedApplication.personalInfo?.fullName ||
                      "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedApplication.applicant?.email || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {selectedApplication.personalInfo?.phoneNumber ||
                      selectedApplication.applicant?.phone ||
                      "N/A"}
                  </p>
                  <p>
                    <strong>Occupation:</strong>{" "}
                    {selectedApplication.personalInfo?.occupation || "N/A"}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Pet Information</h6>
                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedApplication.pet?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Species:</strong>{" "}
                    {selectedApplication.pet?.species || "N/A"}
                  </p>
                  <p>
                    <strong>Breed:</strong>{" "}
                    {selectedApplication.pet?.breed || "N/A"}
                  </p>
                  <p>
                    <strong>Age:</strong>{" "}
                    {selectedApplication.pet?.age?.value
                      ? `${selectedApplication.pet.age.value} ${selectedApplication.pet.age.unit}`
                      : "N/A"}
                  </p>
                </Col>
              </Row>
              <hr />
              <h6>Address</h6>
              <Row>
                <Col md={12}>
                  <p>
                    {selectedApplication.address?.street || "N/A"},{" "}
                    {selectedApplication.address?.city || ""},{" "}
                    {selectedApplication.address?.state || ""}{" "}
                    {selectedApplication.address?.zipCode || ""}
                  </p>
                </Col>
              </Row>
              <hr />
              <h6>Living Situation</h6>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>Home Type:</strong>{" "}
                    {selectedApplication.livingSituation?.homeType || "N/A"}
                  </p>
                  <p>
                    <strong>Has Yard:</strong>{" "}
                    {selectedApplication.livingSituation?.hasYard
                      ? "Yes"
                      : "No"}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Ownership:</strong>{" "}
                    {selectedApplication.livingSituation?.homeOwnership ||
                      "N/A"}
                  </p>
                </Col>
              </Row>
              <hr />
              <h6>Pet Experience</h6>
              <p>
                <strong>Had Pets Before:</strong>{" "}
                {selectedApplication.petExperience?.hadPetsBefore
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Current Pets:</strong>{" "}
                {selectedApplication.petExperience?.currentPets ? "Yes" : "No"}
              </p>
              {selectedApplication.petExperience?.currentPetsDetails && (
                <p>
                  <strong>Current Pets Details:</strong>{" "}
                  {selectedApplication.petExperience.currentPetsDetails}
                </p>
              )}
              <p>
                <strong>Experience:</strong>{" "}
                {selectedApplication.petExperience?.petCareExperience || "N/A"}
              </p>
              <hr />
              <h6>Reason for Adoption</h6>
              <p>{selectedApplication.additionalInfo?.whyAdopt || "N/A"}</p>
              <hr />
              <h6>Application Details</h6>
              <p>
                <strong>Status:</strong>{" "}
                {getStatusBadge(selectedApplication.status)}
              </p>
              <p>
                <strong>Applied On:</strong>{" "}
                {formatDate(selectedApplication.createdAt)}
              </p>
              {selectedApplication.adminNotes && (
                <>
                  <hr />
                  <p>
                    <strong>Admin Notes:</strong>{" "}
                    {selectedApplication.adminNotes}
                  </p>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          {selectedApplication &&
            !["approved", "rejected"].includes(selectedApplication.status) && (
              <Button
                variant="primary"
                onClick={() => {
                  setShowDetailModal(false);
                  handleStatusChange(selectedApplication);
                }}
              >
                Update Status
              </Button>
            )}
        </Modal.Footer>
      </Modal>

      {/* Update Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Application Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>New Status</Form.Label>
            <Form.Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Reason/Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Add any notes or reason for status change..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateStatus}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ApplicationManagement;
