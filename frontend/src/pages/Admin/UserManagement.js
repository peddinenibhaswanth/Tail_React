import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
  InputGroup,
  Dropdown,
  ButtonGroup,
} from "react-bootstrap";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getAllUsers,
  deleteUser,
  approveUser,
  updateUserRole,
  resetAdmin,
} from "../../redux/slices/adminSlice";
import * as adminService from "../../api/adminService";
import useAuth from "../../hooks/useAuth";

const CHART_COLORS = ["#0d6efd", "#198754", "#0dcaf0", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];
const CURRENCY = "\u20B9";

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { users, isLoading, isError, isSuccess, errorMessage, pagination } =
    useSelector((state) => state.admin);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-detect co-admin filter from /admin/co-admins path
  const isCoAdminPage = location.pathname.includes("/co-admins");
  const initialRole = isCoAdminPage ? "co-admin" : (searchParams.get("role") || "");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [approvedFilter, setApprovedFilter] = useState(
    searchParams.get("approved") || ""
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsPeriod, setDetailsPeriod] = useState(30);

  useEffect(() => {
    dispatch(resetAdmin());
  }, [dispatch]);

  useEffect(() => {
    const params = {};
    if (roleFilter) params.role = roleFilter;
    if (approvedFilter) params.approved = approvedFilter;
    if (searchTerm) params.search = searchTerm;
    dispatch(getAllUsers(params));
  }, [dispatch, roleFilter, approvedFilter]);

  useEffect(() => {
    if (isSuccess) {
      setSuccessMessage("Operation completed successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        dispatch(resetAdmin());
      }, 3000);
    }
  }, [isSuccess, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (roleFilter) params.role = roleFilter;
    if (approvedFilter) params.approved = approvedFilter;
    if (searchTerm) params.search = searchTerm;
    dispatch(getAllUsers(params));
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      dispatch(deleteUser(selectedUser._id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const handleApprove = (user) => {
    dispatch(approveUser(user._id));
  };

  const handleRoleClick = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleViewDetails = async (targetUser) => {
    setSelectedUser(targetUser);
    setShowDetailsModal(true);
    // For unapproved users, show registration info instead of analytics
    if (!targetUser.isApproved && ['seller', 'veterinary', 'organization'].includes(targetUser.role)) {
      setDetailsLoading(false);
      setUserDetails(null);
      return;
    }
    setDetailsLoading(true);
    setUserDetails(null);
    try {
      const response = await adminService.getUserDetails(targetUser._id, detailsPeriod);
      setUserDetails(response.data);
    } catch (err) {
      console.error("Error loading user details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const confirmRoleChange = () => {
    if (selectedUser && newRole) {
      dispatch(updateUserRole({ id: selectedUser._id, role: newRole }));
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: "danger",
      "co-admin": "warning",
      seller: "info",
      veterinary: "success",
      organization: "secondary",
      customer: "primary",
    };
    return roleColors[role] || "secondary";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading users...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" size="sm" onClick={() => navigate("/admin")} className="mb-2">
            <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
          </Button>
          <h2 className="mb-1">User Management</h2>
          <p className="text-muted mb-0">
            Manage user accounts and permissions ({filteredUsers.length} users)
          </p>
        </div>
      </div>

      {isError && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Search</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" variant="primary">
                      <i className="bi bi-search"></i>
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Filter by Role</Form.Label>
                  <Form.Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                    <option value="veterinary">Veterinary</option>
                    <option value="organization">Organization</option>
                    <option value="co-admin">Co-Admin</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Approval Status</Form.Label>
                  <Form.Select
                    value={approvedFilter}
                    onChange={(e) => setApprovedFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending Approval</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("");
                    setApprovedFilter("");
                    dispatch(getAllUsers({}));
                  }}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm table-card-overflow-fix">
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="rounded-circle me-2"
                            width="32"
                            height="32"
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                            style={{ width: 32, height: 32 }}
                          >
                            <span className="text-white">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge
                        bg={getRoleBadge(user.role)}
                        className="rounded-pill text-uppercase"
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      {(user.role === "seller" || user.role === "veterinary" || user.role === "organization" || user.role === "co-admin") ? (
                        user.isApproved ? (
                          <Badge bg="success">Approved</Badge>
                        ) : (
                          <Badge bg="warning" text="dark">Pending Approval</Badge>
                        )
                      ) : (
                        <Badge bg="secondary">N/A</Badge>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle
                          id={`dropdown-${user._id}`}
                          size="sm"
                          variant="outline-primary"
                        >
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu 
                          align="end"
                          popperConfig={{
                            strategy: 'fixed',
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [0, 2],
                                },
                              },
                            ],
                          }}
                        >
                          {(user.role === "seller" ||
                            user.role === "veterinary" ||
                            user.role === "organization" ||
                            user.role === "co-admin") &&
                            !user.isApproved && (
                              <Dropdown.Item onClick={() => handleApprove(user)}>
                                <i className="bi bi-check-circle me-2"></i>Approve Account
                              </Dropdown.Item>
                            )}
                          <Dropdown.Item onClick={() => handleViewDetails(user)}>
                            <i className="bi bi-eye me-2"></i>View Details
                          </Dropdown.Item>
                          {currentUser?.role === "admin" &&
                            user.role !== "admin" && (
                              <Dropdown.Item
                                onClick={() => handleRoleClick(user)}
                              >
                                <i className="bi bi-person-gear me-2"></i>Change
                                Role
                              </Dropdown.Item>
                            )}
                          {user._id !== currentUser?._id &&
                            user.role !== "admin" &&
                            !(currentUser?.role === "co-admin" && user.role === "co-admin") && (
                              <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => handleDeleteClick(user)}
                                >
                                  <i className="bi bi-trash me-2"></i>Delete
                                </Dropdown.Item>
                              </>
                            )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user{" "}
          <strong>{selectedUser?.name}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Role Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Change role for <strong>{selectedUser?.name}</strong>
          </p>
          <Form.Group>
            <Form.Label>Select New Role</Form.Label>
            <Form.Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="veterinary">Veterinary</option>
              <option value="organization">Organization</option>
              <option value="co-admin">Co-Admin</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmRoleChange}>
            Update Role
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Details Modal */}
      <Modal
        show={showDetailsModal}
        onHide={() => { setShowDetailsModal(false); setUserDetails(null); }}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            User Details &mdash; {selectedUser?.name}{" "}
            <Badge bg="secondary" className="ms-2 text-capitalize">{selectedUser?.role}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Period selector - only show for approved users with analytics */}
          {selectedUser?.isApproved !== false || !['seller', 'veterinary', 'organization'].includes(selectedUser?.role) ? (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">Statistics period:</span>
              <ButtonGroup size="sm">
                {[{ label: "1 Week", value: 7 }, { label: "1 Month", value: 30 }, { label: "1 Year", value: 365 }].map((p) => (
                  <Button
                    key={p.value}
                    variant={detailsPeriod === p.value ? "primary" : "outline-primary"}
                    onClick={() => {
                      setDetailsPeriod(p.value);
                      if (selectedUser) {
                        setDetailsLoading(true);
                        setUserDetails(null);
                        adminService.getUserDetails(selectedUser._id, p.value)
                          .then((res) => setUserDetails(res.data))
                          .catch(console.error)
                          .finally(() => setDetailsLoading(false));
                      }
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          ) : null}

          {detailsLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading details...</p>
            </div>
          )}

          {!detailsLoading && !userDetails && selectedUser && !selectedUser.isApproved &&
            ['seller', 'veterinary', 'organization'].includes(selectedUser.role) ? (
            <>
              <Alert variant="info" className="mb-3">
                <i className="bi bi-info-circle me-2"></i>
                This user is <strong>pending approval</strong>. Below are the details submitted during registration.
              </Alert>

              {/* Basic Info */}
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <div className="fw-semibold mb-2"><i className="bi bi-person me-2"></i>Basic Information</div>
                  <Row className="g-2">
                    <Col sm={6}><strong>Name:</strong> {selectedUser.name}</Col>
                    <Col sm={6}><strong>Email:</strong> {selectedUser.email}</Col>
                    <Col sm={6}><strong>Phone:</strong> {selectedUser.phone || "—"}</Col>
                    <Col sm={6}><strong>Role:</strong> <span className="text-capitalize">{selectedUser.role}</span></Col>
                    <Col sm={6}><strong>Registered:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Veterinary Registration Details */}
              {selectedUser.role === 'veterinary' && (
                <Card className="border-0 bg-light mb-3">
                  <Card.Body>
                    <div className="fw-semibold mb-2"><i className="bi bi-hospital me-2"></i>Veterinary Details</div>
                    <Row className="g-2">
                      <Col sm={6}><strong>Clinic Name:</strong> {selectedUser.vetInfo?.clinicName || "—"}</Col>
                      <Col sm={6}><strong>License Number:</strong> {selectedUser.vetInfo?.licenseNumber || "—"}</Col>
                      <Col sm={12}>
                        <strong>Clinic Address:</strong>{" "}
                        {selectedUser.vetInfo?.fullAddress
                          || (selectedUser.vetInfo?.clinicAddress && typeof selectedUser.vetInfo.clinicAddress === "object"
                            ? [selectedUser.vetInfo.clinicAddress.line1, selectedUser.vetInfo.clinicAddress.line2, selectedUser.vetInfo.clinicAddress.city, selectedUser.vetInfo.clinicAddress.state, selectedUser.vetInfo.clinicAddress.pincode].filter(Boolean).join(", ")
                            : (typeof selectedUser.vetInfo?.clinicAddress === "string" ? selectedUser.vetInfo.clinicAddress : "—"))}
                      </Col>
                      <Col sm={6}><strong>Experience:</strong> {selectedUser.vetInfo?.experience ? `${selectedUser.vetInfo.experience} years` : "—"}</Col>
                      <Col sm={6}><strong>Consultation Fee:</strong> {selectedUser.vetInfo?.consultationFee ? `₹${selectedUser.vetInfo.consultationFee}` : "—"}</Col>
                      {selectedUser.vetInfo?.consultationModes?.length > 0 && (
                        <Col sm={12}>
                          <strong>Consultation Modes:</strong>{" "}
                          {selectedUser.vetInfo.consultationModes.map((m, i) => (
                            <Badge key={i} bg="secondary" className="me-1 text-capitalize">{m.replace("-", " ")}</Badge>
                          ))}
                        </Col>
                      )}
                      <Col sm={12}>
                        <strong>Specializations:</strong>{" "}
                        {selectedUser.vetInfo?.specialization?.length > 0
                          ? selectedUser.vetInfo.specialization.map((s, i) => (
                              <Badge key={i} bg="primary" className="me-1 text-capitalize">{s}</Badge>
                            ))
                          : "—"}
                      </Col>
                      <Col sm={12}>
                        <strong>Available Days:</strong>{" "}
                        {selectedUser.vetInfo?.availableDays?.length > 0
                          ? selectedUser.vetInfo.availableDays.map((d, i) => (
                              <Badge key={i} bg="success" className="me-1 text-capitalize">{d}</Badge>
                            ))
                          : "—"}
                      </Col>
                      {selectedUser.vetInfo?.availableTimeSlots?.length > 0 && (
                        <Col sm={12}>
                          <strong>Time Slots:</strong>{" "}
                          {selectedUser.vetInfo.availableTimeSlots.map((slot, i) => (
                            <Badge key={i} bg="info" className="me-1">{slot.start} - {slot.end}</Badge>
                          ))}
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Seller Registration Details */}
              {selectedUser.role === 'seller' && (
                <Card className="border-0 bg-light mb-3">
                  <Card.Body>
                    <div className="fw-semibold mb-2"><i className="bi bi-shop me-2"></i>Business Details</div>
                    <Row className="g-2">
                      <Col sm={6}><strong>Business Name:</strong> {selectedUser.sellerInfo?.businessName || "—"}</Col>
                      <Col sm={6}><strong>Tax ID:</strong> {selectedUser.sellerInfo?.taxId || "—"}</Col>
                      <Col sm={12}><strong>Business Address:</strong> {selectedUser.sellerInfo?.businessAddress || "—"}</Col>
                      <Col sm={6}><strong>Business Phone:</strong> {selectedUser.sellerInfo?.businessPhone || "—"}</Col>
                      {selectedUser.sellerInfo?.description && (
                        <Col sm={12}><strong>Description:</strong> {selectedUser.sellerInfo.description}</Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Organization Registration Details */}
              {selectedUser.role === 'organization' && (
                <Card className="border-0 bg-light mb-3">
                  <Card.Body>
                    <div className="fw-semibold mb-2"><i className="bi bi-building me-2"></i>Organization Details</div>
                    <Row className="g-2">
                      <Col sm={6}><strong>Organization Name:</strong> {selectedUser.organizationInfo?.orgName || "—"}</Col>
                      <Col sm={6}><strong>Registration Number:</strong> {selectedUser.organizationInfo?.registrationNumber || "—"}</Col>
                      <Col sm={12}><strong>Address:</strong> {selectedUser.organizationInfo?.orgAddress || "—"}</Col>
                      <Col sm={6}><strong>Phone:</strong> {selectedUser.organizationInfo?.orgPhone || "—"}</Col>
                      {selectedUser.organizationInfo?.description && (
                        <Col sm={12}><strong>Description:</strong> {selectedUser.organizationInfo.description}</Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </>
          ) : (
            <>
              {!detailsLoading && !userDetails && selectedUser?.isApproved !== false && (
                <Alert variant="warning">Could not load details for this user.</Alert>
              )}

          {/* SELLER */}
          {!detailsLoading && userDetails?.type === "seller" && (() => {
            const orderStatusChart = (userDetails.orders?.byStatus || []).map((o) => ({
              name: (o.status || "").charAt(0).toUpperCase() + (o.status || "").slice(1),
              count: o.count || 0,
            }));
            const revChart = (userDetails.revenueTrend || []).map((t) => ({
              date: (t._id || "").substring(5),
              revenue: Math.round(t.revenue || 0),
            }));
            return (
              <>
                <Row className="g-3 mb-4">
                  {[
                    ...(currentUser?.role === "admin" ? [
                      { label: "Total Revenue", value: `${CURRENCY}${Math.round(userDetails.revenue?.total || 0).toLocaleString()}`, color: "success" },
                      { label: "Net Earnings", value: `${CURRENCY}${Math.round(userDetails.revenue?.netEarnings || 0).toLocaleString()}`, color: "primary" },
                    ] : []),
                    { label: "Total Orders", value: userDetails.orders?.total || 0, color: "info" },
                    { label: "Products Listed", value: userDetails.products?.length || 0, color: "warning" },
                  ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                      <Card className={`border-${s.color} text-center`}>
                        <Card.Body className="py-3">
                          <div className={`fw-bold fs-4 text-${s.color}`}>{s.value}</div>
                          <div className="text-muted small">{s.label}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Orders by Status</div>
                        {orderStatusChart.length === 0 ? (
                          <p className="text-muted small">No order data.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={orderStatusChart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                                {orderStatusChart.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Revenue Trend</div>
                        {currentUser?.role !== "admin" ? (
                          <p className="text-muted small"><i className="bi bi-lock me-1"></i>Revenue data is only visible to the primary administrator.</p>
                        ) : revChart.length === 0 ? (
                          <p className="text-muted small">No trend data.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={revChart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${CURRENCY}${v}`} />
                              <Tooltip formatter={(v) => [`${CURRENCY}${v.toLocaleString()}`, "Revenue"]} />
                              <Bar dataKey="revenue" fill="#198754" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Top Selling Products */}
                <div className="fw-semibold mb-2">Top Selling Products</div>
                {(userDetails.topSellingProducts || []).length === 0 ? (
                  <p className="text-muted mb-3">No sales data available.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={(userDetails.topSellingProducts || []).slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                        <Tooltip formatter={(v, name) => [name === "totalQuantitySold" ? `${v} units` : `${CURRENCY}${v.toLocaleString()}`, name === "totalQuantitySold" ? "Qty Sold" : "Revenue"]} />
                        <Bar dataKey="totalQuantitySold" name="Qty Sold" fill="#0d6efd" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <Table striped hover size="sm" responsive className="mt-3 mb-4">
                      <thead className="table-dark">
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Qty Sold</th>
                          {currentUser?.role === "admin" && <th>Revenue</th>}
                          <th>Orders</th>
                          <th>Current Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.topSellingProducts.map((tp, idx) => (
                          <tr key={tp.productId || idx}>
                            <td><Badge bg={idx < 3 ? "warning" : "secondary"} text={idx < 3 ? "dark" : "white"}>{idx + 1}</Badge></td>
                            <td className="fw-medium">{tp.name}</td>
                            <td className="text-capitalize">{tp.category}</td>
                            <td className="fw-bold">{tp.totalQuantitySold}</td>
                            {currentUser?.role === "admin" && <td className="text-success">{CURRENCY}{tp.totalRevenue.toLocaleString()}</td>}
                            <td>{tp.orderCount}</td>
                            <td>
                              <Badge bg={tp.currentStock > 0 ? "success" : tp.currentStock === "—" ? "secondary" : "danger"}>
                                {tp.currentStock > 0 ? tp.currentStock : tp.currentStock === "—" ? "—" : "Out of Stock"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}

                {/* Seller Rating Summary */}
                {(() => {
                  const ratedProducts = (userDetails.products || []).filter((p) => p.totalReviews > 0);
                  const sellerAvg = ratedProducts.length > 0
                    ? (ratedProducts.reduce((sum, p) => sum + (p.averageRating || 0), 0) / ratedProducts.length)
                    : null;
                  const totalSellerReviews = (userDetails.products || []).reduce((sum, p) => sum + (p.totalReviews || 0), 0);
                  return sellerAvg !== null ? (
                    <div className="d-flex align-items-center gap-3 mb-3 p-3 border rounded bg-warning bg-opacity-10">
                      <div className="text-center">
                        <div className="fw-bold fs-4 text-warning">{sellerAvg.toFixed(1)}</div>
                        <div>
                          {[1,2,3,4,5].map((s) => (
                            <i key={s} className={`bi bi-star${s <= Math.round(sellerAvg) ? "-fill" : ""} text-warning`} style={{fontSize:"0.8rem"}}></i>
                          ))}
                        </div>
                        <small className="text-muted">Avg Rating</small>
                      </div>
                      <div className="vr"></div>
                      <div className="text-center">
                        <div className="fw-bold fs-4 text-primary">{totalSellerReviews}</div>
                        <small className="text-muted">Total Reviews</small>
                      </div>
                      <div className="vr"></div>
                      <div className="text-center">
                        <div className="fw-bold fs-4 text-success">{ratedProducts.length}</div>
                        <small className="text-muted">Reviewed Products</small>
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="fw-semibold mb-2">Products Listed ({userDetails.products?.length || 0})</div>
                {(userDetails.products || []).length === 0 ? (
                  <p className="text-muted">No products found.</p>
                ) : (
                  <Table striped hover size="sm" responsive>
                    <thead className="table-dark">
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Rating</th>
                        <th>Reviews</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.products.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <a href={`/products/${p._id}`} target="_blank" rel="noreferrer" className="text-decoration-none fw-medium">
                              {p.name}
                            </a>
                          </td>
                          <td className="text-capitalize">{p.category}</td>
                          <td>{CURRENCY}{(p.price || 0).toFixed(2)}</td>
                          <td>{p.stock}</td>
                          <td>
                            {p.averageRating > 0 ? (
                              <span className="d-flex align-items-center gap-1">
                                <i className="bi bi-star-fill text-warning" style={{fontSize:"0.75rem"}}></i>
                                <span className="small fw-semibold">{p.averageRating.toFixed(1)}</span>
                              </span>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>
                          <td>
                            {p.totalReviews > 0 ? (
                              <a href={`/products/${p._id}#reviews`} target="_blank" rel="noreferrer">
                                <Badge bg="info" className="text-decoration-none">
                                  {p.totalReviews}
                                </Badge>
                              </a>
                            ) : (
                              <span className="text-muted small">0</span>
                            )}
                          </td>
                          <td>
                            <Badge bg={p.stock > 0 ? "success" : "secondary"}>
                              {p.stock > 0 ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </>
            );
          })()}

          {/* ORGANIZATION */}
          {!detailsLoading && userDetails?.type === "organization" && (() => {
            const petStatusChart = [
              { name: "Available", value: userDetails.petStats?.available || 0 },
              { name: "Adopted", value: userDetails.petStats?.adopted || 0 },
              { name: "Pending", value: userDetails.petStats?.pending || 0 },
            ].filter((d) => d.value > 0);
            const appChart = [
              { name: "Pending", value: userDetails.applicationStats?.pending || 0 },
              { name: "Approved", value: userDetails.applicationStats?.approved || 0 },
              { name: "Rejected", value: userDetails.applicationStats?.rejected || 0 },
              { name: "Under Review", value: userDetails.applicationStats?.under_review || 0 },
            ].filter((d) => d.value > 0);
            return (
              <>
                <Row className="g-3 mb-4">
                  {[
                    { label: "Total Pets", value: userDetails.petStats?.total || 0, color: "primary" },
                    { label: "Available", value: userDetails.petStats?.available || 0, color: "success" },
                    { label: "Adopted", value: userDetails.petStats?.adopted || 0, color: "info" },
                    { label: "Applications", value: userDetails.totalApplications || 0, color: "warning" },
                  ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                      <Card className={`border-${s.color} text-center`}>
                        <Card.Body className="py-3">
                          <div className={`fw-bold fs-4 text-${s.color}`}>{s.value}</div>
                          <div className="text-muted small">{s.label}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Pet Status Distribution</div>
                        {petStatusChart.length === 0 ? (
                          <p className="text-muted small">No data.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={petStatusChart} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {petStatusChart.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Application Status</div>
                        {appChart.length === 0 ? (
                          <p className="text-muted small">No data.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={appChart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="value" name="Applications" radius={[4, 4, 0, 0]}>
                                {appChart.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <div className="fw-semibold mb-2">Pets ({userDetails.pets?.length || 0})</div>
                {(userDetails.pets || []).length === 0 ? (
                  <p className="text-muted">No pets uploaded.</p>
                ) : (
                  <Table striped hover size="sm" responsive>
                    <thead className="table-dark">
                      <tr>
                        <th>Name</th>
                        <th>Species</th>
                        <th>Breed</th>
                        <th>Age</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.pets.map((p) => (
                        <tr key={p._id}>
                          <td>{p.name}</td>
                          <td className="text-capitalize">{p.species}</td>
                          <td>{p.breed || "\u2014"}</td>
                          <td>{p.age?.value ? `${p.age.value} ${p.age.unit}` : "\u2014"}</td>
                          <td>
                            <Badge bg={p.status === "available" ? "success" : p.status === "adopted" ? "primary" : "secondary"}>
                              {p.status || "\u2014"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </>
            );
          })()}

          {/* VETERINARY */}
          {!detailsLoading && userDetails?.type === "veterinary" && (() => {
            const byStatusArr = userDetails.appointmentStats?.byStatus || [];
            const getStatusCount = (s) => {
              const found = byStatusArr.find((x) => x.status === s);
              return found ? found.count : 0;
            };
            const statusChart = byStatusArr.map((s) => ({
              name: (s.status || "").charAt(0).toUpperCase() + (s.status || "").slice(1),
              count: s.count || 0,
            }));
            const petTypeChart = (userDetails.appointmentStats?.byPetType || []).map((pt) => ({
              name: (pt.type || "Other").charAt(0).toUpperCase() + (pt.type || "Other").slice(1),
              value: pt.count || 0,
            }));
            const rev = userDetails.revenue || {};
            return (
              <>
                {/* Appointment Stats */}
                <Row className="g-3 mb-4">
                  {[
                    { label: "Total Appointments", value: userDetails.appointmentStats?.total || 0, color: "primary" },
                    { label: "Paid Appointments", value: rev.paidAppointments || 0, color: "success" },
                    { label: "Pending", value: getStatusCount("pending"), color: "warning" },
                    { label: "Cancelled", value: getStatusCount("cancelled"), color: "danger" },
                  ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                      <Card className={`border-${s.color} text-center`}>
                        <Card.Body className="py-3">
                          <div className={`fw-bold fs-4 text-${s.color}`}>{s.value}</div>
                          <div className="text-muted small">{s.label}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Financial Summary - Admin only */}
                {currentUser?.role === "admin" && (
                <Card className="border-0 bg-primary bg-opacity-10 mb-4">
                  <Card.Body>
                    <div className="fw-semibold mb-3">
                      <i className="bi bi-currency-rupee me-2"></i>Financial Summary
                    </div>
                    <Row className="g-3">
                      {[
                        { label: "Gross Revenue", value: rev.total || 0, color: "#1565C0", icon: "bi-cash-stack" },
                        { label: `Commission (${rev.commissionRate || 10}%)`, value: rev.totalCommission || 0, color: "#E65100", icon: "bi-percent" },
                        { label: "Net Earnings", value: rev.netEarnings || 0, color: "#2E7D32", icon: "bi-wallet2" },
                        { label: "Current Balance", value: rev.currentBalance || 0, color: "#7B1FA2", icon: "bi-bank" },
                      ].map((r) => (
                        <Col xs={6} md={3} key={r.label}>
                          <div className="text-center p-2 bg-white rounded shadow-sm">
                            <i className={`bi ${r.icon} d-block mb-1`} style={{ fontSize: "1.2rem", color: r.color }}></i>
                            <div className="fw-bold" style={{ color: r.color }}>
                              {CURRENCY}{Math.round(r.value).toLocaleString()}
                            </div>
                            <small className="text-muted">{r.label}</small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                    {(rev.pendingPayments > 0) && (
                      <div className="mt-3 p-2 bg-warning bg-opacity-10 rounded text-center">
                        <i className="bi bi-hourglass-split me-1 text-warning"></i>
                        <strong>{CURRENCY}{Math.round(rev.pendingPayments).toLocaleString()}</strong> pending from{" "}
                        <strong>{rev.pendingPaymentCount}</strong> unpaid appointment(s)
                      </div>
                    )}
                    <div className="d-flex justify-content-between border-top mt-3 pt-2">
                      <small className="text-muted">Avg per appointment</small>
                      <small className="fw-bold">{CURRENCY}{(rev.avgPerAppointment || 0).toLocaleString()}</small>
                    </div>
                  </Card.Body>
                </Card>
                )}

                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Appointments by Status</div>
                        {statusChart.length === 0 ? (
                          <p className="text-muted small">No data.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={statusChart} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                              <XAxis type="number" tick={{ fontSize: 11 }} />
                              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={75} />
                              <Tooltip />
                              <Bar dataKey="count" name="Appointments" radius={[0, 4, 4, 0]}>
                                {statusChart.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">By Pet Type</div>
                        {petTypeChart.length === 0 ? (
                          <p className="text-muted small">No data.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie data={petTypeChart} cx="50%" cy="50%" outerRadius={60} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {petTypeChart.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Transaction History */}
                {(userDetails.transactions || []).length > 0 && (
                  <>
                    <div className="fw-semibold mb-2">
                      <i className="bi bi-receipt me-2"></i>Transaction History
                    </div>
                    <Table striped hover size="sm" responsive className="mb-4">
                      <thead className="table-dark">
                        <tr>
                          <th>Date</th>
                          <th>Transaction ID</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Commission</th>
                          <th>Net Amount</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.transactions.map((t) => (
                          <tr key={t._id}>
                            <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                            <td className="text-muted small">{t.transactionId || "—"}</td>
                            <td>
                              <Badge bg={t.type === "sale" ? "success" : t.type === "refund" ? "danger" : "info"}>
                                {t.type}
                              </Badge>
                            </td>
                            <td className="fw-bold">{CURRENCY}{(t.amount || 0).toLocaleString()}</td>
                            <td className="text-danger">{CURRENCY}{(t.commission || 0).toLocaleString()}</td>
                            <td className="text-success fw-bold">{CURRENCY}{(t.netAmount || 0).toLocaleString()}</td>
                            <td className="small">{t.description || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}

                <div className="fw-semibold mb-2">Recent Appointments</div>
                {(userDetails.appointments || []).length === 0 ? (
                  <p className="text-muted">No appointments found.</p>
                ) : (
                  <Table striped hover size="sm" responsive>
                    <thead className="table-dark">
                      <tr><th>Date</th><th>Customer</th><th>Pet</th><th>Reason</th><th>Fee</th><th>Payment</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {userDetails.appointments.map((a) => (
                        <tr key={a._id}>
                          <td>{new Date(a.date).toLocaleDateString()}</td>
                          <td>{a.customer?.name || "\u2014"}</td>
                          <td>{a.petName || "\u2014"}</td>
                          <td>{a.reason || "\u2014"}</td>
                          <td>{CURRENCY}{a.consultationFee || 0}</td>
                          <td>
                            <Badge bg={a.paymentStatus === "paid" ? "success" : a.paymentStatus === "refunded" ? "danger" : "warning"}>
                              {a.paymentStatus || "pending"}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={a.status === "completed" ? "success" : a.status === "pending" ? "warning" : a.status === "confirmed" ? "info" : "danger"}>
                              {a.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </>
            );
          })()}

          {/* CUSTOMER DETAILS */}
          {!detailsLoading && userDetails?.type === "customer" && (() => {
            const orderStatusChart = (userDetails.orders?.byStatus || []).map((s) => ({
              name: (s.status || "").charAt(0).toUpperCase() + (s.status || "").slice(1),
              count: s.count || 0,
            }));
            return (
              <>
                {/* KPI Cards */}
                <Row className="g-3 mb-4">
                  {[
                    { label: "Total Orders", value: userDetails.orders?.total || 0, color: "primary" },
                    { label: "Total Spent", value: `${CURRENCY}${Math.round(userDetails.spending?.total || 0).toLocaleString()}`, color: "success" },
                    { label: "Avg / Order", value: `${CURRENCY}${(userDetails.spending?.avgPerOrder || 0).toLocaleString()}`, color: "info" },
                    { label: "Adoption Apps", value: userDetails.applications?.total || 0, color: "warning" },
                  ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                      <Card className={`border-${s.color} text-center`}>
                        <Card.Body className="py-3">
                          <div className={`fw-bold fs-4 text-${s.color}`}>{s.value}</div>
                          <div className="text-muted small">{s.label}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Second Row: Vet Appointments + Reviews */}
                <Row className="g-3 mb-4">
                  {[
                    { label: "Vet Appointments", value: userDetails.appointments?.total || 0, color: "primary" },
                    { label: "Vet Spend", value: `${CURRENCY}${(userDetails.appointments?.totalSpent || 0).toLocaleString()}`, color: "success" },
                    { label: "Reviews Given", value: userDetails.reviews?.total || 0, color: "secondary" },
                    { label: "Avg Rating Given", value: userDetails.reviews?.avgRating || "—", color: "warning" },
                  ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                      <Card className={`border-${s.color} text-center`}>
                        <Card.Body className="py-3">
                          <div className={`fw-bold fs-4 text-${s.color}`}>{s.value}</div>
                          <div className="text-muted small">{s.label}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Charts Row */}
                <Row className="g-3 mb-4">
                  <Col md={8}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Spending Trend</div>
                        {(userDetails.spendingTrend || []).length === 0 ? (
                          <p className="text-muted small">No spending data for this period.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={(userDetails.spendingTrend || []).map((d) => ({ date: (d._id || "").substring(5), spending: Math.round(d.spending || 0) }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(v) => [`${CURRENCY}${v.toLocaleString()}`, "Spending"]} />
                              <Bar dataKey="spending" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Orders by Status</div>
                        {orderStatusChart.length === 0 ? (
                          <p className="text-muted small">No orders yet.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={orderStatusChart} cx="50%" cy="50%" outerRadius={65} dataKey="count"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {orderStatusChart.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Recent Orders Table */}
                <div className="fw-semibold mb-2">Recent Orders ({userDetails.recentOrders?.length || 0})</div>
                {(userDetails.recentOrders || []).length === 0 ? (
                  <p className="text-muted">No orders found.</p>
                ) : (
                  <Table striped hover size="sm" responsive className="mb-4">
                    <thead className="table-dark">
                      <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.recentOrders.map((o) => (
                        <tr key={o._id}>
                          <td className="small">{o.orderNumber || "—"}</td>
                          <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td>{o.items?.length || 0}</td>
                          <td>{CURRENCY}{(o.total || 0).toFixed(2)}</td>
                          <td><Badge bg={o.paymentStatus === "paid" ? "success" : "secondary"}>{o.paymentStatus}</Badge></td>
                          <td>
                            <Badge bg={o.status === "delivered" ? "success" : o.status === "pending" ? "warning" : o.status === "cancelled" ? "danger" : "info"}>
                              {o.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}

                {/* Adoption Applications */}
                <div className="fw-semibold mb-2">Adoption Applications ({userDetails.applications?.total || 0})</div>
                {(userDetails.applications?.recent || []).length === 0 ? (
                  <p className="text-muted">No adoption applications.</p>
                ) : (
                  <Table striped hover size="sm" responsive className="mb-4">
                    <thead className="table-dark">
                      <tr>
                        <th>Pet</th>
                        <th>Species</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.applications.recent.map((a) => (
                        <tr key={a._id}>
                          <td>{a.pet?.name || "—"}</td>
                          <td className="text-capitalize">{a.pet?.species || "—"}</td>
                          <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Badge bg={a.status === "approved" ? "success" : a.status === "pending" ? "warning" : a.status === "rejected" ? "danger" : "info"}>
                              {a.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}

                {/* Vet Appointments */}
                <div className="fw-semibold mb-2">Vet Appointments ({userDetails.appointments?.total || 0})</div>
                {(userDetails.appointments?.recent || []).length === 0 ? (
                  <p className="text-muted">No vet appointments.</p>
                ) : (
                  <Table striped hover size="sm" responsive className="mb-4">
                    <thead className="table-dark">
                      <tr>
                        <th>Date</th>
                        <th>Vet</th>
                        <th>Pet</th>
                        <th>Reason</th>
                        <th>Fee</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.appointments.recent.map((a) => (
                        <tr key={a._id}>
                          <td>{new Date(a.date).toLocaleDateString()}</td>
                          <td>{a.veterinary?.name || "—"}</td>
                          <td>{a.petName || "—"}</td>
                          <td>{a.reason || "—"}</td>
                          <td>{CURRENCY}{a.consultationFee || 0}</td>
                          <td>
                            <Badge bg={a.status === "completed" ? "success" : a.status === "pending" ? "warning" : a.status === "confirmed" ? "info" : "danger"}>
                              {a.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}

                {/* Reviews */}
                {(userDetails.reviews?.items || []).length > 0 && (
                  <>
                    <div className="fw-semibold mb-2">Recent Reviews</div>
                    <Table striped hover size="sm" responsive>
                      <thead className="table-dark">
                        <tr>
                          <th>Product</th>
                          <th>Rating</th>
                          <th>Title</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.reviews.items.map((r) => (
                          <tr key={r._id}>
                            <td>{r.product?.name || "—"}</td>
                            <td>{"\u2B50".repeat(r.rating)}</td>
                            <td>{r.title || "—"}</td>
                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </>
            );
          })()}

          {/* OTHER ROLES */}
          {!detailsLoading && userDetails && !["seller", "organization", "veterinary", "customer"].includes(userDetails.type) && (
            <Alert variant="info">
              No detailed metrics are tracked for this user role.
            </Alert>
          )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDetailsModal(false); setUserDetails(null); }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;
