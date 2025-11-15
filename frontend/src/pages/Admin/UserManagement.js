import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
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
  DropdownButton,
} from "react-bootstrap";
import {
  getAllUsers,
  deleteUser,
  approveUser,
  updateUserRole,
  resetAdmin,
} from "../../redux/slices/adminSlice";
import useAuth from "../../hooks/useAuth";

const UserManagement = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useAuth();
  const { users, isLoading, isError, isSuccess, errorMessage, pagination } =
    useSelector((state) => state.admin);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [approvedFilter, setApprovedFilter] = useState(
    searchParams.get("approved") || ""
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
          <h2 className="mb-1">User Management</h2>
          <p className="text-muted mb-0">
            Manage user accounts and permissions ({filteredUsers.length} users)
          </p>
        </div>
      </div>

      {isError && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Filters */}
      <Card className="mb-4">
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
      <Card>
        <Card.Body>
          <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
            <Table striped bordered hover>
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
                        className="text-uppercase"
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      {user.role === "seller" || user.role === "veterinary" ? (
                        user.isApproved ? (
                          <Badge bg="success">Approved</Badge>
                        ) : (
                          <Badge bg="warning">Pending</Badge>
                        )
                      ) : (
                        <Badge bg="secondary">N/A</Badge>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <DropdownButton
                        id={`dropdown-${user._id}`}
                        title="Actions"
                        size="sm"
                        variant="outline-primary"
                      >
                        {(user.role === "seller" ||
                          user.role === "veterinary") &&
                          !user.isApproved && (
                            <Dropdown.Item onClick={() => handleApprove(user)}>
                              <i className="bi bi-check-circle me-2"></i>Approve
                            </Dropdown.Item>
                          )}
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
                          user.role !== "admin" && (
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
                      </DropdownButton>
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
    </Container>
  );
};

export default UserManagement;
