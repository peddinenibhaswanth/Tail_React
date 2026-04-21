import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAdminDashboard } from "../../redux/slices/dashboardSlice";
import useAuth from "../../hooks/useAuth";

const CURRENCY = "\u20B9";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboardData, dashboardType, isLoading, isError, message } = useSelector(
    (state) => state.dashboard
  );
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    dispatch(getAdminDashboard(period));
  }, [dispatch, period]);

  const hasDashboardDataForMe = dashboardType === "admin" && Boolean(dashboardData);

  // Only block on first load for this dashboard; keep existing data visible during refresh.
  if (isLoading && !hasDashboardDataForMe) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  const data = hasDashboardDataForMe ? dashboardData : {};
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
    gmv: data.revenue?.gmv || 0,
    platformCommission: data.revenue?.platformCommission || 0,
    taxCollected: data.revenue?.taxCollected || 0,
    shippingRevenue: data.revenue?.shippingRevenue || 0,
    netPlatformRevenue: data.revenue?.netPlatformRevenue || 0,
    appointmentRevenue: data.revenue?.appointmentRevenue || 0,
    appointmentCommission: data.revenue?.appointmentCommission || 0,
    paidAppointments: data.revenue?.paidAppointments || 0,
    totalPlatformRevenue:
      data.revenue?.totalPlatformRevenue ??
      (data.revenue?.platformCommission || 0) +
        (data.revenue?.appointmentCommission || 0),
    unreadMessages: data.unreadMessages || 0,
    customers:
      data.users?.byRole?.find((r) => r._id === "customer")?.count || 0,
    sellers:
      data.users?.byRole?.find((r) => r._id === "seller")?.count || 0,
    veterinaries:
      data.users?.byRole?.find((r) => r._id === "veterinary")?.count || 0,
    organizations:
      data.users?.byRole?.find((r) => r._id === "organization")?.count || 0,
    totalCoAdmins:
      data.users?.byRole?.find((r) => r._id === "co-admin")?.count || 0,
    pendingSellers: data.pendingApprovals?.sellers || 0,
    pendingVets: data.pendingApprovals?.veterinarians || 0,
    pendingOrgs: data.pendingApprovals?.organizations || 0,
    pendingCoAdmins: data.pendingApprovals?.coAdmins || 0,
  };

  const periodLabel =
    period === 7
      ? "Last 7 Days"
      : period === 30
      ? "Last 30 Days"
      : "Last Year";

  // Revenue chart data
  const fmtDate = (id) =>
    period === 365 ? id : (id || "").substring(5);
  const revenueTrendData = (data.charts?.revenueTrend || []).map((d) => ({
    date: fmtDate(d._id),
    revenue: Math.round(d.revenue || 0),
    orderRevenue: Math.round(d.orderRevenue || 0),
    appointmentRevenue: Math.round(d.appointmentRevenue || 0),
  }));

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-speedometer2 me-2"></i>Admin Dashboard
          </h2>
          <p className="text-muted mb-0">Platform overview</p>
        </div>
        <Badge bg="danger" className="rounded-pill fs-6">
          {user?.role === "co-admin" ? "Co-Admin" : "Administrator"}
        </Badge>
      </div>

      {isError && <Alert variant="danger">{message}</Alert>}

      {/* KPI Cards */}
      <Row className="g-4 mb-4">
        {[
          {
            icon: "bi-people-fill",
            label: "Total Users",
            value: stats.totalUsers,
            sub: `+${stats.newUsers} new this period`,
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
            linkText: "Manage Orders",
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

      {/* Revenue Analytics */}
      <Card className="dashboard-analytics-card mb-4">
        <Card.Header className="dashboard-analytics-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">
            <i className="bi bi-graph-up me-2"></i>Revenue Analytics
          </h5>
          <ButtonGroup size="sm">
            {[
              { label: "1 Week", value: 7 },
              { label: "1 Month", value: 30 },
              { label: "1 Year", value: 365 },
            ].map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "light" : "outline-light"}
                size="sm"
                onClick={() => setPeriod(p.value)}
                className="rounded-pill px-3"
              >
                {p.label}
              </Button>
            ))}
          </ButtonGroup>
        </Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0">
            {[
              {
                label: "Gross Merchandise Value",
                value: stats.gmv,
                sub: "Total Customer Payments",
                bgColor: "#1565C0",
              },
              {
                label: "Seller Commission",
                value: stats.platformCommission,
                sub: "10% from Sellers",
                bgColor: "#2E7D32",
              },
              {
                label: "Vet Appointment Revenue",
                value: stats.appointmentRevenue,
                sub: `${stats.paidAppointments} paid · ₹${Math.round(stats.appointmentCommission).toLocaleString()} commission`,
                bgColor: "#00838F",
              },
              {
                label: "Total Platform Revenue",
                value: stats.totalPlatformRevenue,
                sub: "All commissions combined",
                bgColor: "#E65100",
              },
            ].map((r, i) => (
              <Col md={3} key={r.label} className="dashboard-analytics-metric">
                <div className="dashboard-analytics-metric-value" style={{ color: r.bgColor }}>
                  {CURRENCY}
                  {Math.round(r.value).toLocaleString()}
                </div>
                <div className="dashboard-analytics-metric-label">{r.label}</div>
                <div className="dashboard-analytics-metric-sub">{r.sub}</div>
              </Col>
            ))}
          </Row>
          <hr className="my-0" />
          <div className="p-4">
            <h6 className="text-muted mb-3 fw-semibold">
              <i className="bi bi-graph-up me-2"></i>Revenue Trend — {periodLabel}
            </h6>
            {revenueTrendData.length === 0 ? (
              <div className="dashboard-empty-state py-4">
                <div className="dashboard-empty-icon">
                  <i className="bi bi-graph-up"></i>
                </div>
                <div className="dashboard-empty-title">No Data Available</div>
                <div className="dashboard-empty-text">No revenue data for this period</div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e40af" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(v) => `${CURRENCY}${v.toLocaleString()}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  itemStyle={{ color: '#93c5fd' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                  formatter={(value, name, props) => {
                    const { payload } = props;
                    if (name === 'revenue') {
                      const details = [];
                      if (payload.orderRevenue > 0) {
                        details.push(`Orders: ${CURRENCY}${payload.orderRevenue.toLocaleString()}`);
                      }
                      if (payload.appointmentRevenue > 0) {
                        details.push(`Appointments: ${CURRENCY}${payload.appointmentRevenue.toLocaleString()}`);
                      }
                      return [
                        `${CURRENCY}${value.toLocaleString()}`,
                        details.length > 0 ? `Total (${details.join(' + ')})` : 'Revenue'
                      ];
                    }
                    return [`${CURRENCY}${value.toLocaleString()}`, 'Revenue'];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Revenue Breakdown Link */}
      <Card
        className="dashboard-card dashboard-card-purple mb-4"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/admin/revenue-breakdown")}
      >
        <Card.Body className="text-center p-4">
          <div className="dashboard-card-icon mx-auto mb-3">
            <i className="bi bi-pie-chart-fill"></i>
          </div>
          <h5 className="fw-bold mb-2">Revenue Breakdown</h5>
          <p className="text-muted mb-3">View detailed revenue breakdown by sellers and veterinarians</p>
          <Button variant="primary" className="rounded-pill">
            <i className="bi bi-arrow-right-circle me-2"></i>View Details
          </Button>
        </Card.Body>
      </Card>

      {/* Pending Items Alert */}
      {(stats.pendingApplications > 0 ||
        stats.pendingOrders > 0 ||
        stats.pendingApprovals > 0 ||
        stats.pendingSellers > 0 ||
        stats.pendingVets > 0 ||
        stats.pendingOrgs > 0 ||
        stats.pendingCoAdmins > 0) && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>Items Requiring
            Attention
          </Alert.Heading>
          <ul className="mb-0">
            {stats.pendingApplications > 0 && (
              <li>
                {stats.pendingApplications} pending adoption applications
              </li>
            )}
            {stats.pendingOrders > 0 && (
              <li>{stats.pendingOrders} pending orders</li>
            )}
            {stats.pendingSellers > 0 && (
              <li>{stats.pendingSellers} seller accounts pending approval</li>
            )}
            {stats.pendingVets > 0 && (
              <li>
                {stats.pendingVets} veterinary accounts pending approval
              </li>
            )}
            {stats.pendingOrgs > 0 && (
              <li>
                {stats.pendingOrgs} organization accounts pending approval
              </li>
            )}
            {stats.pendingCoAdmins > 0 && (
              <li>
                {stats.pendingCoAdmins} co-admin accounts pending approval
              </li>
            )}
            {stats.pendingApprovals > 0 && (
              <li>{stats.pendingApprovals} user accounts pending approval</li>
            )}
          </ul>
        </Alert>
      )}

      {/* Management Links + User Breakdown */}
      <Row className="g-4">
        <Col md={4}>
          <Card className="dashboard-table-card h-100">
            <div className="dashboard-table-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-gear-fill me-2 text-primary"></i>User Management
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
                <i className="bi bi-shop me-2"></i>Pending Sellers
                <Badge bg="warning" className="float-end">
                  {stats.pendingSellers}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/admin/users?role=veterinary&approved=false"
              >
                <i className="bi bi-hospital me-2"></i>Pending Vets
                <Badge bg="warning" className="float-end">
                  {stats.pendingVets}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/admin/users?role=organization&approved=false"
              >
                <i className="bi bi-building me-2"></i>Pending Organizations
                <Badge bg="warning" className="float-end">
                  {stats.pendingOrgs}
                </Badge>
              </ListGroup.Item>
              {user?.role === "admin" && (
                <ListGroup.Item action as={Link} to="/admin/co-admins">
                  <i className="bi bi-shield-check me-2"></i>Manage Co-Admins
                  <Badge bg="danger" className="float-end">
                    {stats.totalCoAdmins}
                  </Badge>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="dashboard-table-card h-100">
            <div className="dashboard-table-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-shop-window me-2 text-success"></i>Store &amp; Pets
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
                <Badge bg="warning" className="float-end">
                  {stats.pendingApplications}
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

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
                <i className="bi bi-calendar-check me-2"></i>Appointments
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
              <ListGroup.Item action as={Link} to="/admin/applications">
                <i className="bi bi-file-earmark-text me-2"></i>Applications
                <Badge bg={stats.pendingApplications > 0 ? "warning" : "secondary"} className="float-end">
                  {stats.pendingApplications} pending
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
