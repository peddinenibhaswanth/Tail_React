import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Form,
  Modal,
} from "react-bootstrap";
import {
  getSellerOrders,
  updateOrderStatus,
} from "../../redux/slices/orderSlice";
import { getSellerDashboard } from "../../redux/slices/dashboardSlice";
import useAuth from "../../hooks/useAuth";

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { orders, isLoading: ordersLoading } = useSelector(
    (state) => state.orders
  );
  const {
    dashboardData,
    isLoading: dashboardLoading,
    isError,
    message,
  } = useSelector((state) => state.dashboard);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    // Only fetch if missing to prevent full-page loading flash on navigation.
    if (!orders || orders.length === 0) dispatch(getSellerOrders());
    if (!dashboardData) dispatch(getSellerDashboard());
  }, [dispatch, orders, dashboardData]);

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
    setNewStatus(order.orderStatus || order.status || "pending");
    setShowStatusModal(true);
  };

  const submitStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus }));
      setShowStatusModal(false);
      setSelectedOrder(null);
    }
  };

  const isLoading = ordersLoading || dashboardLoading;
  const hasCachedData = Boolean(dashboardData) || (orders && orders.length > 0);

  // Check if seller is approved
  if (!user?.isApproved) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Account Pending Approval</Alert.Heading>
          <p>
            Your seller account is pending approval from the administrator. You
            will be able to access the seller dashboard once approved.
          </p>
          <hr />
          <p className="mb-0">
            Please check back later or contact support for more information.
          </p>
        </Alert>
      </Container>
    );
  }

  // Only show full-page spinner on first load.
  if (isLoading && !hasCachedData) {
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
    totalProducts: data.products?.total || 0,
    activeProducts: data.products?.active || 0,
    lowStockProducts: data.products?.lowStock || 0,
    outOfStockProducts: data.products?.outOfStock || 0,
    totalOrders: data.orders?.total || orders?.length || 0,
    recentOrders: data.orders?.recent || 0,
    pendingOrders: data.orders?.pending || 0,
    deliveredOrders:
      data.orders?.byStatus?.find((s) => s._id === "delivered")?.count || 0,
    // Professional earnings breakdown like Amazon/Flipkart Seller Hub
    grossSales: data.revenue?.grossSales || 0,
    commissionDeducted: data.revenue?.commissionDeducted || 0,
    netEarnings: data.revenue?.netEarnings || 0,
    pendingRevenue: data.revenue?.pendingRevenue || 0,
  };

  const pendingOrders = orders?.filter((o) => o.status === "pending") || [];
  const processingOrders =
    orders?.filter((o) => o.status === "processing") || [];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Seller Dashboard</h2>
          <p className="text-muted mb-0 small">Welcome back, {user?.name}</p>
        </div>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="dashboard-card dashboard-card-purple h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-box-seam-fill"></i>
              </div>
              <div className="dashboard-card-value">{stats.totalProducts || 0}</div>
              <div className="dashboard-card-label">Total Products</div>
              <div className="dashboard-card-subtitle">Products listed</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-green h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-cart-fill"></i>
              </div>
              <div className="dashboard-card-value">
                {stats.totalOrders || orders?.length || 0}
              </div>
              <div className="dashboard-card-label">Total Orders</div>
              <div className="dashboard-card-subtitle">All time orders</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-teal h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-wallet2"></i>
              </div>
              <div className="dashboard-card-value">
                ₹{(stats.netEarnings || 0).toFixed(0)}
              </div>
              <div className="dashboard-card-label">Net Earnings</div>
              <div className="dashboard-card-subtitle">After 10% platform fee</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-orange h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="dashboard-card-value">
                {stats.pendingOrders || pendingOrders.length}
              </div>
              <div className="dashboard-card-label">Pending Orders</div>
              <div className="dashboard-card-subtitle">Needs attention</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Earnings Breakdown - Professional Marketplace Style */}
      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card className="dashboard-analytics-card">
            <div className="dashboard-analytics-header">
              <h5 className="mb-0 fw-bold"><i className="bi bi-wallet2 me-2"></i>Earnings Breakdown</h5>
            </div>
            <Card.Body className="p-0">
              <Row className="g-0">
                <Col md={3} className="dashboard-analytics-metric">
                  <div className="dashboard-analytics-metric-value" style={{ color: '#1565C0' }}>₹{(stats.grossSales || 0).toFixed(0)}</div>
                  <div className="dashboard-analytics-metric-label">Gross Sales</div>
                  <div className="dashboard-analytics-metric-sub">Total Product Sales</div>
                </Col>
                <Col md={3} className="dashboard-analytics-metric">
                  <div className="dashboard-analytics-metric-value" style={{ color: '#C2185B' }}>- ₹{(stats.commissionDeducted || 0).toFixed(0)}</div>
                  <div className="dashboard-analytics-metric-label">Platform Commission</div>
                  <div className="dashboard-analytics-metric-sub">10% Service Fee</div>
                </Col>
                <Col md={3} className="dashboard-analytics-metric">
                  <div className="dashboard-analytics-metric-value" style={{ color: '#2E7D32' }}>₹{(stats.netEarnings || 0).toFixed(0)}</div>
                  <div className="dashboard-analytics-metric-label">Net Earnings</div>
                  <div className="dashboard-analytics-metric-sub">Payable to You</div>
                </Col>
                <Col md={3} className="dashboard-analytics-metric">
                  <div className="dashboard-analytics-metric-value" style={{ color: '#E65100' }}>₹{(stats.pendingRevenue || 0).toFixed(0)}</div>
                  <div className="dashboard-analytics-metric-label">Pending Revenue</div>
                  <div className="dashboard-analytics-metric-sub">Awaiting Delivery</div>
                </Col>
              </Row>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Net earnings are calculated after deducting 10% platform commission. Tax (18% GST) is collected separately from customers.
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-3">
                <i className="bi bi-lightning me-2"></i>Quick Actions
              </h5>
              <div className="d-grid gap-2">
                <Link to="/seller/products" className="btn btn-primary rounded-pill">
                  <i className="bi bi-box me-2"></i>Manage My Products
                </Link>
                <Link to="/seller/products/add" className="btn btn-success rounded-pill">
                  <i className="bi bi-plus-circle me-2"></i>Add New Product
                </Link>
                <Link to="/seller/orders" className="btn btn-outline-primary rounded-pill">
                  <i className="bi bi-bag me-2"></i>View All Orders
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-3">
                <i className="bi bi-graph-up me-2"></i>Quick Stats
              </h5>
              <Row>
                <Col xs={6} className="mb-3">
                  <div className="border-0 shadow-sm rounded p-3 text-center">
                    <div className="h4 mb-0 text-primary">
                      {stats.activeProducts || 0}
                    </div>
                    <small className="text-muted">Active Products</small>
                  </div>
                </Col>
                <Col xs={6} className="mb-3">
                  <div className="border-0 shadow-sm rounded p-3 text-center">
                    <div className="h4 mb-0 text-warning">
                      {stats.lowStockProducts || 0}
                    </div>
                    <small className="text-muted">Low Stock</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="border-0 shadow-sm rounded p-3 text-center">
                    <div className="h4 mb-0 text-success">
                      {stats.deliveredOrders || 0}
                    </div>
                    <small className="text-muted">Delivered</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="border-0 shadow-sm rounded p-3 text-center">
                    <div className="h4 mb-0 text-info">
                      {processingOrders.length}
                    </div>
                    <small className="text-muted">Processing</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Orders</h5>
          <Link to="/seller/orders" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </Card.Header>
        <Card.Body>
          {orders && orders.length > 0 ? (
            <Table responsive hover>
              <thead>
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
                {orders.slice(0, 10).map((order) => (
                  <tr key={order._id}>
                    <td>
                      <code>#{order.orderNumber || order._id.slice(-8)}</code>
                    </td>
                    <td>{order.customer?.name || "N/A"}</td>
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
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleStatusUpdate(order)}
                      >
                        Update Status
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
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-3">No orders yet.</p>
              <p>Start by adding products to receive orders.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pending Orders Alert */}
      {pendingOrders.length > 0 && (
        <Alert variant="warning" className="d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <span>
            You have <strong>{pendingOrders.length}</strong> pending order(s)
            that need attention.
          </span>
        </Alert>
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
                <strong>Order ID:</strong> #{selectedOrder._id.slice(-8)}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.user?.name}
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

export default SellerDashboard;
