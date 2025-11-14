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
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrders,
  updateOrderStatus,
  resetOrders,
} from "../../redux/slices/orderSlice";

const OrderManagement = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.orders
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    dispatch(getAllOrders({}));
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && message?.includes("updated")) {
      setShowStatusModal(false);
      dispatch(resetOrders());
      dispatch(getAllOrders({}));
    }
  }, [isSuccess, message, dispatch]);

  const handleStatusUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus || order.status || "pending");
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus }));
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return (
      <Badge bg={variants[status] || "secondary"} className="text-uppercase">
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (status) => {
    const variants = {
      pending: "warning",
      paid: "success",
      failed: "danger",
      refunded: "info",
    };
    return (
      <Badge bg={variants[status] || "secondary"} className="text-uppercase">
        {status}
      </Badge>
    );
  };

  // Ensure orders is always an array
  const ordersList = Array.isArray(orders) ? orders : [];

  const filteredOrders = ordersList.filter((order) => {
    const orderId = order._id || "";
    const customerName = order.user?.name || "";
    const customerEmail = order.user?.email || "";
    const orderStatus = order.orderStatus || order.status || "";

    const matchesSearch =
      orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate statistics
  const stats = {
    total: ordersList.length,
    pending: ordersList.filter((o) => (o.orderStatus || o.status) === "pending")
      .length,
    processing: ordersList.filter(
      (o) => (o.orderStatus || o.status) === "processing"
    ).length,
    shipped: ordersList.filter((o) => (o.orderStatus || o.status) === "shipped")
      .length,
    delivered: ordersList.filter(
      (o) => (o.orderStatus || o.status) === "delivered"
    ).length,
    cancelled: ordersList.filter(
      (o) => (o.orderStatus || o.status) === "cancelled"
    ).length,
    totalRevenue: ordersList
      .filter((o) => (o.orderStatus || o.status) === "delivered")
      .reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0),
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Order Management</h2>
          <p className="text-muted mb-0">Manage all customer orders</p>
        </div>
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
        <Col md={2}>
          <Card className="text-center bg-primary bg-opacity-10">
            <Card.Body className="py-3">
              <h4 className="mb-0">{stats.total}</h4>
              <small className="text-muted">Total Orders</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-warning bg-opacity-10">
            <Card.Body className="py-3">
              <h4 className="mb-0">{stats.pending}</h4>
              <small className="text-muted">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-info bg-opacity-10">
            <Card.Body className="py-3">
              <h4 className="mb-0">{stats.processing}</h4>
              <small className="text-muted">Processing</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-primary bg-opacity-10">
            <Card.Body className="py-3">
              <h4 className="mb-0">{stats.shipped}</h4>
              <small className="text-muted">Shipped</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-success bg-opacity-10">
            <Card.Body className="py-3">
              <h4 className="mb-0">{stats.delivered}</h4>
              <small className="text-muted">Delivered</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-success bg-opacity-10">
            <Card.Body className="py-3">
              <h4 className="mb-0">₹{stats.totalRevenue.toFixed(0)}</h4>
              <small className="text-muted">Revenue</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Form.Control
              type="text"
              placeholder="Search by order ID, customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "350px" }}
            />
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: "180px" }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
              <p>No orders found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <code>#{order._id.slice(-8)}</code>
                      </td>
                      <td>
                        <strong>{order.user?.name || "N/A"}</strong>
                        <br />
                        <small className="text-muted">
                          {order.user?.email || "N/A"}
                        </small>
                      </td>
                      <td>
                        <small>{formatDate(order.createdAt)}</small>
                      </td>
                      <td>
                        {order.orderItems?.length || order.items?.length || 0}{" "}
                        item(s)
                      </td>
                      <td>
                        <strong>
                          ₹
                          {(order.totalPrice || order.totalAmount || 0).toFixed(
                            2
                          )}
                        </strong>
                      </td>
                      <td>
                        {getPaymentBadge(
                          order.paymentStatus || order.isPaid
                            ? "paid"
                            : "pending"
                        )}
                      </td>
                      <td>
                        {getStatusBadge(order.orderStatus || order.status)}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleStatusUpdate(order)}
                        >
                          Update
                        </Button>
                        <Link
                          to={`/orders/${order._id}`}
                          className="btn btn-outline-info btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p>
                <strong>Order ID:</strong> #{selectedOrder._id.slice(-8)}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.user?.name || "N/A"}
              </p>
              <p>
                <strong>Total:</strong> ₹
                {(
                  selectedOrder.totalPrice ||
                  selectedOrder.totalAmount ||
                  0
                ).toFixed(2)}
              </p>
              <hr />
              <Form.Group>
                <Form.Label>New Status</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmStatusUpdate}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderManagement;
