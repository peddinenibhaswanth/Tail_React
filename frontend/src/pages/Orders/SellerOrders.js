import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Container,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Form,
  Modal,
  Card,
} from "react-bootstrap";
import {
  getSellerOrders,
  updateOrderStatus,
  resetOrders,
} from "../../redux/slices/orderSlice";
import { getSellerDashboard } from "../../redux/slices/dashboardSlice";

const SellerOrders = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.orders
  );

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(getSellerOrders());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && message) {
      // Refresh order list after successful update
      dispatch(getSellerOrders());
      // Refresh dashboard to update revenue
      dispatch(getSellerDashboard());

      setTimeout(() => {
        dispatch(resetOrders());
      }, 2000);
    }
  }, [isSuccess, message, dispatch]);

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return statusColors[status] || "secondary";
  };

  const handleStatusUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status || "pending");
    setShowStatusModal(true);
  };

  const submitStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus }));
      setShowStatusModal(false);
      setSelectedOrder(null);
    }
  };

  const filteredOrders = statusFilter
    ? orders?.filter((o) => o.status === statusFilter)
    : orders;

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading orders...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Product Orders</h2>
        <Form.Select
          style={{ width: "200px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}
      {isSuccess && message && <Alert variant="success">{message}</Alert>}

      {filteredOrders && filteredOrders.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <code>#{order.orderNumber || order._id.slice(-8)}</code>
                    </td>
                    <td>
                      <div>{order.customer?.name || "N/A"}</div>
                      <small className="text-muted">
                        {order.customer?.email}
                      </small>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.items?.length || 0} item(s)</td>
                    <td className="fw-semibold">
                      ₹{(order.total || 0).toFixed(2)}
                    </td>
                    <td>
                      <Badge
                        bg={getStatusBadge(order.status)}
                        className="text-uppercase"
                      >
                        {order.status}
                      </Badge>
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
                        className="btn btn-sm btn-outline-secondary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-bag-x display-1 text-muted"></i>
            </div>
            <h4 className="mb-3">No orders yet</h4>
            <p className="text-muted">
              When customers order your products, they will appear here.
            </p>
            <Link to="/seller/products" className="btn btn-primary">
              Manage Products
            </Link>
          </Card.Body>
        </Card>
      )}

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p>
                <strong>Order ID:</strong> #
                {selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.customer?.name}
              </p>
              <p>
                <strong>Current Status:</strong>{" "}
                <Badge bg={getStatusBadge(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </p>
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
          <Button variant="primary" onClick={submitStatusUpdate}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SellerOrders;
