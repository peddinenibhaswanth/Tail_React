import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  Button,
  ButtonGroup,
} from "react-bootstrap";
import { getAdminDashboard } from "../../redux/slices/dashboardSlice";
import useAuth from "../../hooks/useAuth";

const CoAdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboardData, isLoading, isError, message } = useSelector(
    (state) => state.dashboard
  );
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    dispatch(getAdminDashboard(period));
  }, [dispatch, period]);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  const data = dashboardData || {};
  const stats = {
    totalUsers: data.users?.total || 0,
    newUsers: data.users?.new || 0,
    pendingApprovals: data.users?.pending || 0,
    totalPets: data.pets?.total || 0,
    availablePets: data.pets?.available || 0,
    adoptedPets: data.pets?.adopted || 0,
    totalProducts: data.products?.total || 0,
    lowStockProducts: data.products?.lowStock || 0,
    totalOrders: data.orders?.total || 0,
    recentOrders: data.orders?.recent || 0,
    pendingOrders:
      data.orders?.byStatus?.find((s) => s._id === "pending")?.count || 0,
    totalAppointments: data.appointments?.total || 0,
    pendingApplications: data.applications?.pending || 0,
    unreadMessages: data.unreadMessages || 0,
    customers:
      data.users?.byRole?.find((r) => r._id === "customer")?.count || 0,
    sellers:
      data.users?.byRole?.find((r) => r._id === "seller")?.count || 0,
    veterinaries:
      data.users?.byRole?.find((r) => r._id === "veterinary")?.count || 0,
    organizations:
      data.users?.byRole?.find((r) => r._id === "organization")?.count || 0,
    pendingSellers: data.pendingApprovals?.sellers || 0,
    pendingVets: data.pendingApprovals?.veterinarians || 0,
    pendingOrgs: data.pendingApprovals?.organizations || 0,
  };

  const periodLabel =
    period === 7
      ? "Last 7 Days"
      : period === 30
      ? "Last 30 Days"
      : "Last Year";

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-speedometer2 me-2"></i>Co-Admin Dashboard
          </h2>
          <p className="text-muted mb-0">
            Welcome, {user?.name || "Co-Admin"} — Manage users, approvals & platform content
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ButtonGroup size="sm">
            {[
              { label: "1 Week", value: 7 },
              { label: "1 Month", value: 30 },
              { label: "1 Year", value: 365 },
            ].map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setPeriod(p.value)}
                className="rounded-pill px-3"
              >
                {p.label}
              </Button>
            ))}
          </ButtonGroup>
          <Badge bg="warning" text="dark" className="rounded-pill fs-6">
            Co-Admin
          </Badge>
        </div>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* Pending Items Alert - Most important for co-admin */}
      {(stats.pendingApplications > 0 ||
        stats.pendingOrders > 0 ||
        stats.pendingApprovals > 0 ||
        stats.pendingSellers > 0 ||
        stats.pendingVets > 0 ||
        stats.pendingOrgs > 0) && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>Items Requiring
            Your Attention
          </Alert.Heading>
          <ul className="mb-0">
            {stats.pendingSellers > 0 && (
              <li>
                <Link to="/admin/users?role=seller&approved=false">
                  <strong>{stats.pendingSellers}</strong> seller accounts pending approval
                </Link>
              </li>
            )}
            {stats.pendingVets > 0 && (
              <li>
                <Link to="/admin/users?role=veterinary&approved=false">
                  <strong>{stats.pendingVets}</strong> veterinary accounts pending approval
                </Link>
              </li>
            )}
            {stats.pendingOrgs > 0 && (
              <li>
                <Link to="/admin/users?role=organization&approved=false">
                  <strong>{stats.pendingOrgs}</strong> organization accounts pending approval
                </Link>
              </li>
            )}
            {stats.pendingApplications > 0 && (
              <li>
                <Link to="/admin/applications">
                  <strong>{stats.pendingApplications}</strong> pending adoption applications
                </Link>
              </li>
            )}
            {stats.pendingOrders > 0 && (
              <li>
                <Link to="/admin/orders">
                  <strong>{stats.pendingOrders}</strong> pending orders
                </Link>
              </li>
            )}
          </ul>
        </Alert>
      )}

      {/* KPI Cards - No revenue data */}
      <Row className="g-4 mb-4">
        {[
          {
            icon: "bi-people-fill",
            label: "Total Users",
            value: stats.totalUsers,
            sub: `+${stats.newUsers} new (${periodLabel})`,
            colorClass: "dashboard-card-blue",
            link: "/admin/users",
            linkText: "Manage Users",
          },
          {
            icon: "bi-heart-fill",
            label: "Total Pets",
            value: stats.totalPets,
            sub: `${stats.availablePets} available · ${stats.adoptedPets} adopted`,
            colorClass: "dashboard-card-pink",
            link: "/admin/pets",
            linkText: "Manage Pets",
          },
          {
            icon: "bi-box-seam-fill",
            label: "Total Products",
            value: stats.totalProducts,
            sub: `${stats.lowStockProducts} low stock items`,
            colorClass: "dashboard-card-purple",
            link: "/admin/products",
            linkText: "Manage Products",
          },
          {
            icon: "bi-cart-fill",
            label: "Total Orders",
            value: stats.totalOrders,
            sub: `${stats.recentOrders} recent orders`,
            colorClass: "dashboard-card-orange",
            link: "/admin/orders",
            linkText: "View Orders",
          },
        ].map((c) => (
          <Col md={3} key={c.label}>
            <Card className={`dashboard-card ${c.colorClass} h-100`}>
              <Card.Body className="text-center p-4">
                <div className="dashboard-card-icon mx-auto">
                  <i className={`bi ${c.icon}`}></i>
                </div>
                <div className="dashboard-card-value">{c.value}</div>
                <div className="dashboard-card-label">{c.label}</div>
                <div className="dashboard-card-subtitle">{c.sub}</div>
              </Card.Body>
              <div className="dashboard-card-footer text-center">
                <Link to={c.link} className="dashboard-card-link">
                  {c.linkText} <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Management Links + User Breakdown */}
      <Row className="g-4">
        {/* User Management - Primary focus for co-admin */}
        <Col md={4}>
          <Card className="dashboard-table-card h-100">
            <div className="dashboard-table-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-person-check-fill me-2 text-primary"></i>User Management
              </h6>
            </div>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/admin/users">
                <i className="bi bi-people me-2"></i>All Users
                <Badge bg="primary" className="float-end">
                  {stats.totalUsers}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/admin/users?role=seller&approved=false"
              >
                <i className="bi bi-shop me-2 text-warning"></i>Pending Sellers
                <Badge bg="warning" text="dark" className="float-end">
                  {stats.pendingSellers}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/admin/users?role=veterinary&approved=false"
              >
                <i className="bi bi-hospital me-2 text-warning"></i>Pending Vets
                <Badge bg="warning" text="dark" className="float-end">
                  {stats.pendingVets}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/admin/users?role=organization&approved=false"
              >
                <i className="bi bi-building me-2 text-warning"></i>Pending Organizations
                <Badge bg="warning" text="dark" className="float-end">
                  {stats.pendingOrgs}
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        {/* Content Management */}
        <Col md={4}>
          <Card className="dashboard-table-card h-100">
            <div className="dashboard-table-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-shop-window me-2 text-success"></i>Content Management
              </h6>
            </div>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/admin/products">
                <i className="bi bi-box-seam me-2"></i>Products
                <Badge bg="info" className="float-end">
                  {stats.totalProducts}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/orders">
                <i className="bi bi-cart me-2"></i>Orders
                <Badge bg="success" className="float-end">
                  {stats.totalOrders}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/pets">
                <i className="bi bi-heart me-2"></i>Pet Listings
                <Badge bg="success" className="float-end">
                  {stats.totalPets}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/applications">
                <i className="bi bi-file-earmark-text me-2"></i>Adoption
                Applications
                <Badge bg="warning" text="dark" className="float-end">
                  {stats.pendingApplications}
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        {/* User Breakdown & Misc */}
        <Col md={4}>
          <Card className="dashboard-table-card h-100">
            <div className="dashboard-table-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-bar-chart-fill me-2 text-info"></i>User Breakdown
              </h6>
            </div>
            <Card.Body>
              <Row className="g-2">
                {[
                  { label: "Customers", value: stats.customers, color: "primary" },
                  { label: "Sellers", value: stats.sellers, color: "success" },
                  {
                    label: "Veterinaries",
                    value: stats.veterinaries,
                    color: "info",
                  },
                  {
                    label: "Organizations",
                    value: stats.organizations,
                    color: "secondary",
                  },
                ].map((u) => (
                  <Col xs={6} key={u.label}>
                    <div className="border rounded p-2 text-center">
                      <div className={`h5 mb-0 text-${u.color}`}>{u.value}</div>
                      <small className="text-muted">{u.label}</small>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/admin/appointments">
                <i className="bi bi-calendar me-2"></i>Appointments
                <Badge bg="info" className="float-end">
                  {stats.totalAppointments}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/messages">
                <i className="bi bi-envelope me-2"></i>Messages
                <Badge
                  bg={stats.unreadMessages > 0 ? "danger" : "secondary"}
                  className="float-end"
                >
                  {stats.unreadMessages} unread
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* Info Notice */}
      <Alert variant="info" className="mt-4 mb-0">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Your Role:</strong> As a Co-Admin, you can manage users (approve/delete sellers, vets, organisations & customers), 
        moderate content, and handle support messages. Revenue analytics and co-admin management are handled by the primary administrator.
      </Alert>
    </Container>
  );
};

export default CoAdminDashboard;
