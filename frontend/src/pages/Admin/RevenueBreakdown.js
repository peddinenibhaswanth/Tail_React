import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
  Alert,
  Button,
  ButtonGroup,
  Tabs,
  Tab,
} from "react-bootstrap";
import axios from "../../api/axios";

const CURRENCY = "\u20B9";

const RevenueBreakdown = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState("veterinary");
  const [vetRevenue, setVetRevenue] = useState([]);
  const [sellerRevenue, setSellerRevenue] = useState([]);

  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`/api/admin/revenue-breakdown?period=${period}`);
      console.log("Revenue breakdown response:", data);
      setVetRevenue(data.data.veterinaryBreakdown || []);
      setSellerRevenue(data.data.sellerBreakdown || []);
    } catch (err) {
      console.error("Revenue breakdown error:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch revenue breakdown");
    } finally {
      setLoading(false);
    }

  }, [period]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const periodLabel =
    period === 7
      ? "Last 7 Days"
      : period === 30
      ? "Last 30 Days"
      : "Last Year";

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading revenue breakdown...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-2"
          >
            <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
          </Button>
          <h2 className="mb-1">
            <i className="bi bi-pie-chart-fill me-2"></i>Revenue Breakdown
          </h2>
          <p className="text-muted mb-0">Detailed revenue analysis by sellers and veterinarians</p>
        </div>
        <ButtonGroup size="sm">
          {[
            { label: "1 Week", value: 7 },
            { label: "1 Month", value: 30 },
            { label: "1 Year", value: 365 },
          ].map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "primary" : "outline-primary"}
              onClick={() => setPeriod(p.value)}
              className="rounded-pill px-3"
            >
              {p.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="dashboard-card dashboard-card-blue h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-hospital"></i>
              </div>
              <div className="dashboard-card-value">{vetRevenue.length}</div>
              <div className="dashboard-card-label">Veterinarians</div>
              <div className="dashboard-card-subtitle">Active earners</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-green h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-shop"></i>
              </div>
              <div className="dashboard-card-value">{sellerRevenue.length}</div>
              <div className="dashboard-card-label">Sellers</div>
              <div className="dashboard-card-subtitle">Active earners</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-purple h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-cash-stack"></i>
              </div>
              <div className="dashboard-card-value">
                {CURRENCY}
                {Math.round(
                  vetRevenue.reduce((sum, v) => sum + (v.totalRevenue || 0), 0) +
                    sellerRevenue.reduce((sum, s) => sum + (s.totalRevenue || 0), 0)
                ).toLocaleString()}
              </div>
              <div className="dashboard-card-label">Total Revenue</div>
              <div className="dashboard-card-subtitle">{periodLabel}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="dashboard-card dashboard-card-orange h-100">
            <Card.Body className="text-center p-4">
              <div className="dashboard-card-icon mx-auto">
                <i className="bi bi-percent"></i>
              </div>
              <div className="dashboard-card-value">
                {CURRENCY}
                {Math.round(
                  vetRevenue.reduce((sum, v) => sum + (v.totalRevenue * (v.commissionRate / 100)), 0) +
                    sellerRevenue.reduce((sum, s) => sum + (s.totalRevenue * (s.commissionRate / 100)), 0)
                ).toLocaleString()}
              </div>
              <div className="dashboard-card-label">Total Commission</div>
              <div className="dashboard-card-subtitle">Platform earnings</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for Vet and Seller Breakdown */}
      <Card className="dashboard-table-card">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-0"
            fill
          >
            {/* Veterinary Tab */}
            <Tab
              eventKey="veterinary"
              title={
                <span>
                  <i className="bi bi-hospital me-2"></i>Veterinarians ({vetRevenue.length})
                </span>
              }
            >
              <div className="p-3">
                {vetRevenue.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox display-4 text-muted"></i>
                    <p className="text-muted mt-2">No veterinary revenue data for this period</p>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Veterinarian</th>
                        <th>Email</th>
                        <th>Paid Appointments</th>
                        <th>Gross Revenue</th>
                        <th>Commission Rate</th>
                        <th>Platform Commission</th>
                        <th>Vet Net Earnings</th>
                        <th title="Accumulated net earnings available for payout to the veterinarian">Current Balance <i className="bi bi-info-circle small"></i></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vetRevenue.map((v, idx) => {
                        const commission = v.totalRevenue * (v.commissionRate / 100);
                        const netEarnings = v.totalRevenue - commission;
                        return (
                          <tr key={v.vetId || idx}>
                            <td>
                              <Badge
                                bg={idx < 3 ? "warning" : "secondary"}
                                text={idx < 3 ? "dark" : "white"}
                              >
                                {idx + 1}
                              </Badge>
                            </td>
                            <td className="fw-medium">Dr. {v.name || "Unknown"}</td>
                            <td className="text-muted small">{v.email || "—"}</td>
                            <td>{v.count}</td>
                            <td className="fw-bold">
                              {CURRENCY}{Math.round(v.totalRevenue).toLocaleString()}
                            </td>
                            <td>
                              <Badge bg="info">{v.commissionRate}%</Badge>
                            </td>
                            <td className="text-danger">
                              {CURRENCY}{Math.round(commission).toLocaleString()}
                            </td>
                            <td className="text-success fw-bold">
                              {CURRENCY}{Math.round(netEarnings).toLocaleString()}
                            </td>
                            <td>
                              <Badge bg={v.balance > 0 ? "success" : "secondary"}>
                                {CURRENCY}{Math.round(v.balance || 0).toLocaleString()}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-secondary fw-bold">
                      <tr>
                        <td colSpan="3">TOTALS</td>
                        <td>{vetRevenue.reduce((sum, v) => sum + v.count, 0)}</td>
                        <td>
                          {CURRENCY}
                          {Math.round(
                            vetRevenue.reduce((sum, v) => sum + v.totalRevenue, 0)
                          ).toLocaleString()}
                        </td>
                        <td>—</td>
                        <td className="text-danger">
                          {CURRENCY}
                          {Math.round(
                            vetRevenue.reduce(
                              (sum, v) => sum + v.totalRevenue * (v.commissionRate / 100),
                              0
                            )
                          ).toLocaleString()}
                        </td>
                        <td className="text-success">
                          {CURRENCY}
                          {Math.round(
                            vetRevenue.reduce(
                              (sum, v) => sum + (v.totalRevenue - v.totalRevenue * (v.commissionRate / 100)),
                              0
                            )
                          ).toLocaleString()}
                        </td>
                        <td>
                          {CURRENCY}
                          {Math.round(
                            vetRevenue.reduce((sum, v) => sum + (v.balance || 0), 0)
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                )}
              </div>
            </Tab>

            {/* Seller Tab */}
            <Tab
              eventKey="seller"
              title={
                <span>
                  <i className="bi bi-shop me-2"></i>Sellers ({sellerRevenue.length})
                </span>
              }
            >
              <div className="p-3">
                {sellerRevenue.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox display-4 text-muted"></i>
                    <p className="text-muted mt-2">No seller revenue data for this period</p>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Seller</th>
                        <th>Email</th>
                        <th>Delivered Orders</th>
                        <th>Products Sold</th>
                        <th>Gross Revenue</th>
                        <th>Commission Rate</th>
                        <th>Platform Commission</th>
                        <th>Seller Net Earnings</th>
                        <th title="Accumulated net earnings available for payout to the seller">Current Balance <i className="bi bi-info-circle small"></i></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerRevenue.map((s, idx) => {
                        const commission = s.totalRevenue * (s.commissionRate / 100);
                        const netEarnings = s.totalRevenue - commission;
                        return (
                          <tr key={s.sellerId || idx}>
                            <td>
                              <Badge
                                bg={idx < 3 ? "warning" : "secondary"}
                                text={idx < 3 ? "dark" : "white"}
                              >
                                {idx + 1}
                              </Badge>
                            </td>
                            <td className="fw-medium">{s.name || "Unknown"}</td>
                            <td className="text-muted small">{s.email || "—"}</td>
                            <td>{s.orderCount}</td>
                            <td>{s.productsSold}</td>
                            <td className="fw-bold">
                              {CURRENCY}{Math.round(s.totalRevenue).toLocaleString()}
                            </td>
                            <td>
                              <Badge bg="info">{s.commissionRate}%</Badge>
                            </td>
                            <td className="text-danger">
                              {CURRENCY}{Math.round(commission).toLocaleString()}
                            </td>
                            <td className="text-success fw-bold">
                              {CURRENCY}{Math.round(netEarnings).toLocaleString()}
                            </td>
                            <td>
                              <Badge bg={s.balance > 0 ? "success" : "secondary"}>
                                {CURRENCY}{Math.round(s.balance || 0).toLocaleString()}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-secondary fw-bold">
                      <tr>
                        <td colSpan="3">TOTALS</td>
                        <td>{sellerRevenue.reduce((sum, s) => sum + s.orderCount, 0)}</td>
                        <td>{sellerRevenue.reduce((sum, s) => sum + s.productsSold, 0)}</td>
                        <td>
                          {CURRENCY}
                          {Math.round(
                            sellerRevenue.reduce((sum, s) => sum + s.totalRevenue, 0)
                          ).toLocaleString()}
                        </td>
                        <td>—</td>
                        <td className="text-danger">
                          {CURRENCY}
                          {Math.round(
                            sellerRevenue.reduce(
                              (sum, s) => sum + s.totalRevenue * (s.commissionRate / 100),
                              0
                            )
                          ).toLocaleString()}
                        </td>
                        <td className="text-success">
                          {CURRENCY}
                          {Math.round(
                            sellerRevenue.reduce(
                              (sum, s) => sum + (s.totalRevenue - s.totalRevenue * (s.commissionRate / 100)),
                              0
                            )
                          ).toLocaleString()}
                        </td>
                        <td>
                          {CURRENCY}
                          {Math.round(
                            sellerRevenue.reduce((sum, s) => sum + (s.balance || 0), 0)
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RevenueBreakdown;
