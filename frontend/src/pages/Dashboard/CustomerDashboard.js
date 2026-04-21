import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import { getUserOrders } from "../../redux/slices/orderSlice";
import { getUserAppointments } from "../../redux/slices/appointmentSlice";
import { getCustomerDashboard } from "../../redux/slices/dashboardSlice";
import { getMyMessages } from "../../redux/slices/messageSlice";
import useAuth from "../../hooks/useAuth";

const CustomerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { orders, isLoading: ordersLoading } = useSelector(
    (state) => state.orders
  );
  const { appointments, isLoading: appointmentsLoading } = useSelector(
    (state) => state.appointments
  );
  const {
    dashboardData,
    dashboardType,
    isLoading: dashboardLoading,
    isError,
    message,
  } = useSelector((state) => state.dashboard);
  const {
    messages: userMessages,
    isLoading: messagesLoading,
    hasFetchedMyMessages,
  } = useSelector(
    (state) => state.messages
  );

  useEffect(() => {
    // Only fetch if we don't already have data cached in Redux.
    // This avoids a full-page loading spinner every time you navigate away and back.
    if (!orders || orders.length === 0) dispatch(getUserOrders());
    if (!appointments || appointments.length === 0)
      dispatch(getUserAppointments());
    if (dashboardType !== "customer" && !dashboardLoading) dispatch(getCustomerDashboard());
    if (!hasFetchedMyMessages && !messagesLoading) dispatch(getMyMessages());
  }, [dispatch, orders, appointments, dashboardType, dashboardLoading, hasFetchedMyMessages, messagesLoading]);

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
      scheduled: "info",
      confirmed: "primary",
      completed: "success",
    };
    return statusColors[status] || "secondary";
  };

  const isLoading = ordersLoading || appointmentsLoading || dashboardLoading;
  const hasDashboardDataForMe = dashboardType === "customer" && Boolean(dashboardData);
  const hasCachedData =
    hasDashboardDataForMe ||
    (orders && orders.length > 0) ||
    (appointments && appointments.length > 0) ||
    (userMessages && userMessages.length > 0);

  // Only block the whole page on first load when nothing is cached yet.
  if (isLoading && !hasCachedData) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  // Extract nested data from API response
  const data = hasDashboardDataForMe ? dashboardData : {};
  const stats = {
    totalOrders: data.orders?.total || 0,
    activeOrders: data.orders?.active || 0,
    completedOrders: data.orders?.completed || 0,
    totalAppointments: data.appointments?.total || 0,
    upcomingAppointments: data.appointments?.upcoming || 0,
    totalApplications: data.applications?.total || 0,
    pendingApplications: data.applications?.pending || 0,
    approvedApplications: data.applications?.approved || 0,
  };

  // Get recent activity data
  const recentOrders = data.recentActivity?.orders || orders || [];
  const recentAppointments =
    data.recentActivity?.appointments || appointments || [];

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Welcome back, {user?.name}! 👋</h2>
        <p className="text-muted mb-0">Here's what's happening with your account</p>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* Dashboard Stats */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="stat-card h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="stat-icon mx-auto mb-2" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                <i className="bi bi-bag-fill"></i>
              </div>
              <div className="stat-number" style={{ color: 'var(--primary-600)' }}>
                {stats.totalOrders}
              </div>
              <div className="stat-label">Total Orders</div>
              <small className="text-success d-block mb-2">
                {stats.activeOrders} Active
              </small>
              <Link
                to="/orders"
                className="btn btn-sm btn-outline-primary rounded-pill mt-2"
              >
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="stat-icon mx-auto mb-2" style={{ background: 'var(--success-100)', color: 'var(--success-600)' }}>
                <i className="bi bi-calendar-check-fill"></i>
              </div>
              <div className="stat-number" style={{ color: 'var(--success-600)' }}>
                {stats.totalAppointments}
              </div>
              <div className="stat-label">Appointments</div>
              <small className="text-info d-block mb-2">
                {stats.upcomingAppointments} Upcoming
              </small>
              <Link
                to="/appointments"
                className="btn btn-sm btn-outline-success rounded-pill mt-2"
              >
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="stat-icon mx-auto mb-2" style={{ background: 'var(--info-100)', color: 'var(--info-600)' }}>
                <i className="bi bi-file-earmark-text-fill"></i>
              </div>
              <div className="stat-number" style={{ color: 'var(--info-600)' }}>
                {stats.totalApplications}
              </div>
              <div className="stat-label">Adoption Applications</div>
              <small className="text-warning d-block mb-2">
                {stats.pendingApplications} Pending
              </small>
              <Link
                to="/applications"
                className="btn btn-sm btn-outline-info rounded-pill mt-2"
              >
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="stat-icon mx-auto mb-2" style={{ background: 'var(--warning-100)', color: 'var(--warning-600)' }}>
                <i className="bi bi-heart-fill"></i>
              </div>
              <div className="stat-number" style={{ color: 'var(--warning-600)' }}>
                {stats.approvedApplications}
              </div>
              <div className="stat-label">Pets Adopted</div>
              <small className="text-success d-block mb-2">
                Approved Applications
              </small>
              <Link
                to="/profile"
                className="btn btn-sm btn-outline-warning rounded-pill mt-2"
              >
                My Profile
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="feature-card h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-cart-fill fs-5"></i>
              </div>
              <h5 className="fw-bold">Shop Products</h5>
              <p className="text-muted small">
                Browse our collection of pet supplies and accessories.
              </p>
              <Link to="/products" className="btn btn-primary btn-sm rounded-pill px-3">
                <i className="bi bi-arrow-right me-1"></i>Shop Now
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="feature-card h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="feature-icon mb-3" style={{ background: 'var(--success-100)', color: 'var(--success-600)' }}>
                <i className="bi bi-heart-fill fs-5"></i>
              </div>
              <h5 className="fw-bold">Adopt a Pet</h5>
              <p className="text-muted small">
                Find your perfect furry companion today.
              </p>
              <Link to="/pets" className="btn btn-success btn-sm rounded-pill px-3">
                <i className="bi bi-arrow-right me-1"></i>Browse Pets
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="feature-card h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="feature-icon mb-3" style={{ background: 'var(--info-100)', color: 'var(--info-600)' }}>
                <i className="bi bi-calendar-check-fill fs-5"></i>
              </div>
              <h5 className="fw-bold">Book Appointment</h5>
              <p className="text-muted small">
                Schedule a visit with our veterinarians.
              </p>
              <Link to="/appointments/book" className="btn btn-info btn-sm rounded-pill px-3">
                <i className="bi bi-arrow-right me-1"></i>Book Now
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center border-0 py-3">
          <h5 className="mb-0 fw-bold"><i className="bi bi-bag me-2 text-primary"></i>Recent Orders</h5>
          <Link to="/orders" className="btn btn-sm btn-outline-primary rounded-pill px-3">
            View All
          </Link>
        </Card.Header>
        <Card.Body>
          {recentOrders && recentOrders.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td>
                      <code>#{order.orderNumber || order._id.slice(-8)}</code>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>₹{(order.total || 0).toFixed(2)}</td>
                    <td>
                      <Badge
                        bg={getStatusBadge(order.status)}
                        className="text-uppercase"
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td>
                      <Link
                        to={`/orders/${order._id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-3">No orders yet. Start shopping!</p>
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Upcoming Appointments</h5>
          <Link
            to="/my-appointments"
            className="btn btn-sm btn-outline-success"
          >
            View All
          </Link>
        </Card.Header>
        <Card.Body>
          {recentAppointments && recentAppointments.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Veterinarian</th>
                  <th>Pet</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments
                  .filter((apt) => new Date(apt.date) >= new Date())
                  .slice(0, 5)
                  .map((appointment) => (
                    <tr key={appointment._id}>
                      <td>
                        {new Date(appointment.date).toLocaleDateString()} at{" "}
                        {appointment.timeSlot?.start
                          ? `${appointment.timeSlot.start}`
                          : appointment.time || "N/A"}
                      </td>
                      <td>Dr. {appointment.veterinary?.name || "N/A"}</td>
                      <td>
                        {appointment.petName || appointment.pet?.name || "N/A"}
                      </td>
                      <td>
                        <Badge
                          bg={getStatusBadge(appointment.status)}
                          className="text-uppercase"
                        >
                          {appointment.status}
                        </Badge>
                      </td>
                      <td>
                        <Link
                          to={`/appointments/${appointment._id}/view`}
                          className="btn btn-sm btn-outline-success"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-3">No appointments scheduled.</p>
              <Link to="/appointments/book" className="btn btn-success">
                Book an Appointment
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* My Messages & Replies */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-envelope me-2"></i>
            My Messages
          </h5>
          <Link to="/contact" className="btn btn-sm btn-outline-info">
            Send New Message
          </Link>
        </Card.Header>
        <Card.Body>
          {messagesLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : userMessages && userMessages.length > 0 ? (
            <div className="messages-list">
              {userMessages.slice(0, 5).map((msg) => (
                <Card
                  key={msg._id}
                  className={`mb-3 ${
                    msg.response?.text ? "border-success" : "border-light"
                  }`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong>{msg.subject}</strong>
                        <Badge
                          bg={
                            msg.status === "replied"
                              ? "success"
                              : msg.status === "read"
                              ? "secondary"
                              : "primary"
                          }
                          className="ms-2"
                        >
                          {msg.status}
                        </Badge>
                      </div>
                      <small className="text-muted">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <p className="text-muted mb-2 small">
                      {msg.body?.substring(0, 100)}...
                    </p>

                    {/* Show admin reply if exists */}
                    {msg.response?.text && (
                      <div className="mt-3 p-3 bg-success bg-opacity-10 rounded">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-reply-fill text-success me-2"></i>
                          <small className="text-success fw-bold">
                            Admin Reply
                          </small>
                          <small className="text-muted ms-2">
                            {new Date(
                              msg.response.respondedAt
                            ).toLocaleDateString()}
                          </small>
                        </div>
                        <p className="mb-0 small">{msg.response.text}</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-envelope-open fs-1 text-muted d-block mb-3"></i>
              <p className="text-muted mb-3">No messages yet.</p>
              <Link to="/contact" className="btn btn-info">
                Contact Us
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerDashboard;
