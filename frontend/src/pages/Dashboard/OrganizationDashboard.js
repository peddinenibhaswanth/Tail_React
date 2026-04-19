import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import useAuth from "../../hooks/useAuth";
import axios from "../../api/axios";
import { resolveImageUrl } from "../../utils/imageUrl";

const OrganizationDashboard = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const CACHE_KEY = "org-dashboard:myPets";
  const CACHE_TTL_MS = 30 * 1000;

  useEffect(() => {
    // Show cached data immediately to avoid a loading flash on navigation.
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.data) &&
          typeof parsed.fetchedAt === "number" &&
          Date.now() - parsed.fetchedAt < CACHE_TTL_MS
        ) {
          setPets(parsed.data);
          setIsLoading(false);
        }
      }
    } catch {
      // ignore cache read errors
    }

    fetchMyPets({ useBackgroundRefresh: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyPets = async ({ useBackgroundRefresh = false } = {}) => {
    try {
      if (!useBackgroundRefresh) setIsLoading(true);
      const response = await axios.get("/api/pets/my-pets");
      if (response.data.success) {
        const nextPets = response.data.data || [];
        setPets(nextPets);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: nextPets, fetchedAt: Date.now() })
          );
        } catch {
          // ignore cache write errors
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching pets");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if organization is approved
  if (!user?.isApproved) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Account Pending Approval</Alert.Heading>
          <p>
            Your organization account is pending approval from the
            administrator. You will be able to upload pets for adoption once your
            account is approved.
          </p>
        </Alert>
      </Container>
    );
  }

  const stats = {
    total: pets.length,
    available: pets.filter((p) => p.status === "available").length,
    pending: pets.filter((p) => p.status === "pending").length,
    adopted: pets.filter((p) => p.status === "adopted").length,
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: "success",
      adopted: "info",
      pending: "warning",
      not_available: "secondary",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading && pets.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Organization Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome back, {user?.organizationInfo?.orgName || user?.name}
          </p>
        </div>
        <Button as={Link} to="/organization/pets/new" variant="primary">
          <i className="bi bi-plus-lg me-2"></i>Add New Pet
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="dashboard-card dashboard-card-pink h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-heart-fill"></i>
              </div>
              <div className="dashboard-card-value">{stats.total}</div>
              <div className="dashboard-card-label">Total Pets</div>
              <div className="dashboard-card-subtitle">All uploaded pets</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card dashboard-card-green h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div className="dashboard-card-value">{stats.available}</div>
              <div className="dashboard-card-label">Available</div>
              <div className="dashboard-card-subtitle">Ready for adoption</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card dashboard-card-orange h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="dashboard-card-value">{stats.pending}</div>
              <div className="dashboard-card-label">Pending</div>
              <div className="dashboard-card-subtitle">Awaiting approval</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card dashboard-card-teal h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-house-heart-fill"></i>
              </div>
              <div className="dashboard-card-value">{stats.adopted}</div>
              <div className="dashboard-card-label">Adopted</div>
              <div className="dashboard-card-subtitle">Found forever homes</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Pets Table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Adoption Requests</h5>
          <Button
            as={Link}
            to="/organization/applications"
            variant="outline-warning"
            size="sm"
          >
            View Requests
          </Button>
        </Card.Header>
        <Card.Body className="text-center py-3">
          <p className="text-muted mb-2">
            Review and accept or reject adoption applications for your pets.
          </p>
          <Button as={Link} to="/organization/applications" variant="warning">
            <i className="bi bi-clipboard-check me-2"></i>Manage Adoption Requests
          </Button>
        </Card.Body>
      </Card>

      {/* Recent Pets Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Your Pets</h5>
          <Button
            as={Link}
            to="/organization/pets"
            variant="outline-primary"
            size="sm"
          >
            View All
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {pets.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-heart fs-1 text-muted"></i>
              <p className="text-muted mt-2">
                No pets uploaded yet. Start by adding a new pet!
              </p>
              <Button as={Link} to="/organization/pets/new" variant="primary">
                <i className="bi bi-plus-lg me-2"></i>Add Your First Pet
              </Button>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Species</th>
                  <th>Breed</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pets.slice(0, 10).map((pet) => (
                  <tr key={pet._id}>
                    <td>
                      <img
                        src={
                          pet.mainImage
                            ? resolveImageUrl(pet.mainImage, "pets")
                            : "/placeholder-pet.png"
                        }
                        alt={pet.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </td>
                    <td className="fw-semibold">{pet.name}</td>
                    <td>{pet.species}</td>
                    <td>{pet.breed}</td>
                    <td>{getStatusBadge(pet.status)}</td>
                    <td>{formatDate(pet.createdAt)}</td>
                    <td>
                      <Button
                        as={Link}
                        to={`/organization/pets/${pet._id}/edit`}
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrganizationDashboard;
