import React, { useState } from "react";
import {
  Navbar as BootstrapNavbar,
  Nav,
  Container,
  NavDropdown,
  Badge,
  Modal,
  Button,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import { logout } from "../../redux/slices/authSlice";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isStaff } = useAuth();
  const { itemCount } = useCart();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logout());
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const getDashboardLink = () => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case "admin":
      case "co-admin":
        return "/admin";
      case "seller":
        return "/seller/dashboard";
      case "veterinary":
        return "/vet/dashboard";
      case "organization":
        return "/organization/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Check if user is a customer (can shop, adopt, book appointments)
  const isCustomer = !user?.role || user?.role === "customer";

  return (
    <BootstrapNavbar bg="light" expand="lg" className="shadow-sm sticky-top">
      <Container>
        <BootstrapNavbar.Brand
          as={Link}
          to="/"
          className="fw-bold text-primary d-flex align-items-center"
        >
          <span className="fs-4">🐾</span>
          <span className="ms-2">Tail Waggers</span>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle
          aria-controls="basic-navbar-nav"
          aria-label="Toggle navigation"
        />

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Show Home, About, Contact only for customers or non-logged in users */}
            {(!isAuthenticated || isCustomer) && (
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>
            )}
            {/* Show Adopt a Pet, Shop, Book Appointment only for customers or non-logged in users */}
            {(!isAuthenticated || isCustomer) && (
              <>
                <Nav.Link as={Link} to="/pets">
                  Adopt a Pet
                </Nav.Link>
                <Nav.Link as={Link} to="/products">
                  Shop
                </Nav.Link>
                <Nav.Link as={Link} to="/appointments/book">
                  Book Appointment
                </Nav.Link>
              </>
            )}
            {(!isAuthenticated || isCustomer) && (
              <>
                <Nav.Link as={Link} to="/about">
                  About
                </Nav.Link>
                <Nav.Link as={Link} to="/contact">
                  Contact
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="d-flex align-items-center">
            {/* Show cart only for customers */}
            {(!isAuthenticated || isCustomer) && (
              <Nav.Link
                as={Link}
                to="/cart"
                className="position-relative d-flex align-items-center"
                aria-label={`Shopping cart with ${itemCount} items`}
              >
                <span>🛒 Cart</span>
                {itemCount > 0 && (
                  <Badge bg="danger" pill className="ms-2">
                    {itemCount}
                  </Badge>
                )}
              </Nav.Link>
            )}

            {/* Notification bell - visible for all authenticated users */}
            {isAuthenticated && (
              <div className="d-flex align-items-center position-relative">
                <NotificationBell />
              </div>
            )}

            {isAuthenticated ? (
              <NavDropdown
                title={
                  <span>
                    👤 {user?.name || "Account"}
                    {user?.role && user.role !== "customer" && (
                      <Badge
                        bg="info"
                        className="ms-1"
                        style={{ fontSize: "0.7em" }}
                      >
                        {user.role}
                      </Badge>
                    )}
                  </span>
                }
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} to={getDashboardLink()}>
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/profile">
                  Profile
                </NavDropdown.Item>

                {/* Customer-specific links */}
                {(!user?.role || user?.role === "customer") && (
                  <>
                    <NavDropdown.Item as={Link} to="/orders">
                      My Orders
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/appointments">
                      My Appointments
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/applications">
                      My Applications
                    </NavDropdown.Item>
                  </>
                )}

                {/* Seller-specific links */}
                {user?.role === "seller" && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/seller/products">
                      <i className="bi bi-box me-2"></i>My Products
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/seller/orders">
                      <i className="bi bi-bag me-2"></i>My Orders
                    </NavDropdown.Item>
                  </>
                )}

                {/* Veterinary-specific links */}
                {user?.role === "veterinary" && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/vet/appointments">
                      <i className="bi bi-calendar me-2"></i>My Appointments
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/vet/history">
                      <i className="bi bi-clock-history me-2"></i>History
                    </NavDropdown.Item>
                  </>
                )}

                {/* Organization-specific links */}
                {user?.role === "organization" && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/organization/pets">
                      <i className="bi bi-heart me-2"></i>My Pets
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/organization/pets/new">
                      <i className="bi bi-plus-circle me-2"></i>Add Pet
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/organization/applications">
                      <i className="bi bi-clipboard-check me-2"></i>Adoption Requests
                    </NavDropdown.Item>
                  </>
                )}

                {/* Admin/Co-admin links */}
                {isStaff && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/admin">
                      <i className="bi bi-speedometer2 me-2"></i>Admin Panel
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/users">
                      <i className="bi bi-people me-2"></i>Manage Users
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/pets">
                      <i className="bi bi-heart me-2"></i>Manage Pets
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/products">
                      <i className="bi bi-box me-2"></i>Manage Products
                    </NavDropdown.Item>
                  </>
                )}

                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={handleLogout}
                  className="text-danger"
                >
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/register"
                  className="btn btn-primary text-white ms-2"
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutModal} onHide={cancelLogout} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-2">
            <i className="bi bi-box-arrow-right text-danger" style={{ fontSize: "2.5rem" }}></i>
            <p className="mt-3 mb-0 fs-5">Are you sure you want to log out?</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pt-0">
          <Button variant="secondary" onClick={cancelLogout}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmLogout}>
            Yes, Log Out
          </Button>
        </Modal.Footer>
      </Modal>
    </BootstrapNavbar>
  );
};

export default Navbar;
