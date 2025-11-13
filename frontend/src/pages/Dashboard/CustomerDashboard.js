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
    isLoading: dashboardLoading,
    isError,
    message,
  } = useSelector((state) => state.dashboard);
  const { messages: userMessages, isLoading: messagesLoading } = useSelector(
    (state) => state.messages
  );

  useEffect(() => {
    dispatch(getUserOrders());
    dispatch(getUserAppointments());
    dispatch(getCustomerDashboard());
    dispatch(getMyMessages());
  }, [dispatch]);

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

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  // Extract nested data from API response
  const data = dashboardData || {};
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
      <h2 className="mb-4">Welcome back, {user?.name}!</h2>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* Dashboard Stats */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-primary mb-2">
                {stats.totalOrders}
              </div>
              <h6 className="text-muted">Total Orders</h6>
              <small className="text-success d-block mb-2">
                {stats.activeOrders} Active
              </small>
              <Link
                to="/orders"
                className="btn btn-sm btn-outline-primary mt-2"
              >
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-success mb-2">
                {stats.totalAppointments}
              </div>
              <h6 className="text-muted">Appointments</h6>
              <small className="text-info d-block mb-2">
                {stats.upcomingAppointments} Upcoming
              </small>
              <Link
                to="/appointments"
                className="btn btn-sm btn-outline-success mt-2"
              >
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-info mb-2">
                {stats.totalApplications}
              </div>
              <h6 className="text-muted">Adoption Applications</h6>
              <small className="text-warning d-block mb-2">
                {stats.pendingApplications} Pending
              </small>
              <Link
                to="/applications"
                className="btn btn-sm btn-outline-info mt-2"
              >
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-warning mb-2">
                {stats.approvedApplications}
              </div>
              <h6 className="text-muted">Pets Adopted</h6>
              <small className="text-success d-block mb-2">
                Approved Applications
              </small>
              <Link
                to="/profile"
                className="btn btn-sm btn-outline-warning mt-2"
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
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title">
                <i className="bi bi-cart me-2"></i>Shop Products
              </h5>
              <p className="text-muted">
                Browse our collection of pet supplies and accessories.
              </p>
              <Link to="/products" className="btn btn-primary">
                Shop Now
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title">
                <i className="bi bi-heart me-2"></i>Adopt a Pet
              </h5>
              <p className="text-muted">
                Find your perfect furry companion today.
              </p>
              <Link to="/pets" className="btn btn-success">
                Browse Pets
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title">
                <i className="bi bi-calendar-check me-2"></i>Book Appointment
              </h5>
              <p className="text-muted">
                Schedule a visit with our veterinarians.
              </p>
              <Link to="/appointments/book" className="btn btn-info">
                Book Now
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Orders</h5>
          <Link to="/orders" className="btn btn-sm btn-outline-primary">
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
