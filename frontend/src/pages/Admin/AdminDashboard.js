import React, { useEffect } from "react";
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
} from "react-bootstrap";
import { getAdminDashboard } from "../../redux/slices/dashboardSlice";
import useAuth from "../../hooks/useAuth";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboardData, isLoading, isError, message } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(getAdminDashboard());
  }, [dispatch]);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading admin dashboard...</p>
      </Container>
    );
  }

  // Extract nested data from API response
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
    upcomingAppointments: data.appointments?.upcoming || 0,
    pendingApplications: data.applications?.pending || 0,
    // Professional revenue metrics
    gmv: data.revenue?.gmv || 0, // Gross Merchandise Value
    platformCommission: data.revenue?.platformCommission || 0,
    taxCollected: data.revenue?.taxCollected || 0,
    shippingRevenue: data.revenue?.shippingRevenue || 0,
    netPlatformRevenue: data.revenue?.netPlatformRevenue || 0,
    unreadMessages: data.unreadMessages || 0,
    // Calculate role counts from byRole array
    customers:
      data.users?.byRole?.find((r) => r._id === "customer")?.count || 0,
    sellers: data.users?.byRole?.find((r) => r._id === "seller")?.count || 0,
    veterinaries:
      data.users?.byRole?.find((r) => r._id === "veterinary")?.count || 0,
    totalCoAdmins:
      data.users?.byRole?.find((r) => r._id === "co-admin")?.count || 0,
    pendingSellers: data.pendingApprovals?.sellers || 0,
    pendingVets: data.pendingApprovals?.veterinarians || 0,
    todayOrders: data.recentActivity?.newOrders || 0,
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <Badge bg="danger" className="fs-6">
          {user?.role === "co-admin" ? "Co-Admin" : "Administrator"}
        </Badge>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* Main Stats */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-primary text-white">
            <Card.Body className="text-center">
              <i className="bi bi-people display-4 mb-2"></i>
              <div className="display-5">{stats.totalUsers || 0}</div>
              <h6>Total Users</h6>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 text-center">
              <Link to="/admin/users" className="text-white">
                Manage Users →
              </Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-success text-white">
            <Card.Body className="text-center">
              <i className="bi bi-heart display-4 mb-2"></i>
              <div className="display-5">{stats.totalPets || 0}</div>
              <h6>Total Pets</h6>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 text-center">
              <Link to="/admin/pets" className="text-white">
                Manage Pets →
              </Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-info text-white">
            <Card.Body className="text-center">
              <i className="bi bi-box-seam display-4 mb-2"></i>
              <div className="display-5">{stats.totalProducts || 0}</div>
              <h6>Total Products</h6>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 text-center">
              <Link to="/admin/products" className="text-white">
                Manage Products →
              </Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="text-center">
              <i className="bi bi-cart display-4 mb-2"></i>
              <div className="display-5">{stats.totalOrders || 0}</div>
              <h6>Total Orders</h6>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 text-center">
              <Link to="/admin/orders" className="text-dark">
                Manage Orders →
              </Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Revenue Analytics - Professional Marketplace Style */}
      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0"><i className="bi bi-graph-up me-2"></i>Revenue Analytics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center border-end">
                  <div className="display-6 text-primary">₹{(stats.gmv || 0).toFixed(0)}</div>
                  <small className="text-muted d-block">Gross Merchandise Value</small>
                  <small className="text-muted">(Total Customer Payments)</small>
                </Col>
                <Col md={3} className="text-center border-end">
                  <div className="display-6 text-success">₹{(stats.platformCommission || 0).toFixed(0)}</div>
                  <small className="text-muted d-block">Platform Commission</small>
                  <small className="text-muted">(10% from Sellers)</small>
                </Col>
                <Col md={3} className="text-center border-end">
                  <div className="display-6 text-info">₹{(stats.taxCollected || 0).toFixed(0)}</div>
                  <small className="text-muted d-block">Tax Collected</small>
                  <small className="text-muted">(18% GST - Liability)</small>
                </Col>
                <Col md={3} className="text-center">
                  <div className="display-6 text-warning">₹{(stats.netPlatformRevenue || 0).toFixed(0)}</div>
                  <small className="text-muted d-block">Net Platform Revenue</small>
                  <small className="text-muted">(Commission + Shipping)</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-success">
                ₹{(stats.shippingRevenue || 0).toFixed(0)}
              </div>
              <small className="text-muted">Shipping Revenue</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-warning">
                {stats.pendingApplications || 0}
              </div>
              <small className="text-muted">Pending Applications</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-info">
                {stats.totalAppointments || 0}
              </div>
              <small className="text-muted">Total Appointments</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-danger">
                {stats.unreadMessages || 0}
              </div>
              <small className="text-muted">Unread Messages</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pending Items Alert */}
      {(stats.pendingApplications > 0 ||
        stats.pendingOrders > 0 ||
        stats.pendingApprovals > 0 ||
        stats.pendingSellers > 0 ||
        stats.pendingVets > 0) && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Items Requiring Attention
          </Alert.Heading>
          <ul className="mb-0">
            {stats.pendingApplications > 0 && (
              <li>{stats.pendingApplications} pending adoption applications</li>
            )}
            {stats.pendingOrders > 0 && (
              <li>{stats.pendingOrders} pending orders</li>
            )}
            {stats.pendingSellers > 0 && (
              <li>{stats.pendingSellers} seller accounts pending approval</li>
            )}
            {stats.pendingVets > 0 && (
              <li>{stats.pendingVets} veterinary accounts pending approval</li>
            )}
            {stats.pendingApprovals > 0 && (
              <li>{stats.pendingApprovals} user accounts pending approval</li>
            )}
          </ul>
        </Alert>
      )}

      {/* Quick Management Links */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>User Management
              </h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/admin/users">
                <i className="bi bi-people me-2"></i>
                All Users
                <Badge bg="primary" className="float-end">
                  {stats.totalUsers || 0}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/admin/users?role=seller&approved=false"
              >
                <i className="bi bi-shop me-2"></i>
                Pending Seller Approvals
                <Badge bg="warning" className="float-end">
                  {stats.pendingSellers || 0}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/admin/users?role=veterinary&approved=false"
              >
                <i className="bi bi-hospital me-2"></i>
                Pending Vet Approvals
                <Badge bg="warning" className="float-end">
                  {stats.pendingVets || 0}
                </Badge>
              </ListGroup.Item>
              {user?.role === "admin" && (
                <ListGroup.Item action as={Link} to="/admin/co-admins">
                  <i className="bi bi-shield-check me-2"></i>
                  Manage Co-Admins
                  <Badge bg="danger" className="float-end">
                    {stats.totalCoAdmins || 0}
                  </Badge>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-shop me-2"></i>Store Management
              </h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/admin/products">
                <i className="bi bi-box-seam me-2"></i>
                All Products
                <Badge bg="info" className="float-end">
                  {stats.totalProducts || 0}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/orders">
                <i className="bi bi-cart me-2"></i>
                All Orders
                <Badge bg="success" className="float-end">
                  {stats.totalOrders || 0}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/pets">
                <i className="bi bi-heart me-2"></i>
                Pet Listings
                <Badge bg="success" className="float-end">
                  {stats.totalPets || 0}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/applications">
                <i className="bi bi-file-earmark-text me-2"></i>
                Adoption Applications
                <Badge bg="warning" className="float-end">
                  {stats.pendingApplications || 0}
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-calendar-check me-2"></i>Appointments &
                Messages
              </h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/admin/appointments">
                <i className="bi bi-calendar me-2"></i>
                All Appointments
                <Badge bg="info" className="float-end">
                  {stats.totalAppointments || 0}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/messages">
                <i className="bi bi-envelope me-2"></i>
                Contact Messages
                <Badge
                  bg={stats.unreadMessages > 0 ? "danger" : "secondary"}
                  className="float-end"
                >
                  {stats.unreadMessages || 0} unread
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>Quick Stats
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={6} className="mb-3">
                  <div className="border rounded p-3 text-center">
                    <div className="h4 mb-0 text-primary">
                      {stats.customers || 0}
                    </div>
                    <small className="text-muted">Customers</small>
                  </div>
                </Col>
                <Col xs={6} className="mb-3">
                  <div className="border rounded p-3 text-center">
                    <div className="h4 mb-0 text-success">
                      {stats.sellers || 0}
                    </div>
                    <small className="text-muted">Sellers</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="border rounded p-3 text-center">
                    <div className="h4 mb-0 text-info">
                      {stats.veterinaries || 0}
                    </div>
                    <small className="text-muted">Veterinaries</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="border rounded p-3 text-center">
                    <div className="h4 mb-0 text-warning">
                      {stats.todayOrders || 0}
                    </div>
                    <small className="text-muted">Today's Orders</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
