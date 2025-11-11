import React from "react";
import {
  Navbar as BootstrapNavbar,
  Nav,
  Container,
  NavDropdown,
  Badge,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import { logout } from "../../redux/slices/authSlice";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isAdmin, isStaff } = useAuth();
  const { itemCount } = useCart();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

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
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/pets">
              Adopt a Pet
            </Nav.Link>
            <Nav.Link as={Link} to="/products">
              Shop
            </Nav.Link>
            <Nav.Link as={Link} to="/appointments/book">
              Book Appointment
            </Nav.Link>
            <Nav.Link as={Link} to="/about">
              About
            </Nav.Link>
            <Nav.Link as={Link} to="/contact">
              Contact
            </Nav.Link>
          </Nav>

          <Nav>
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

            {isAuthenticated ? (
              <NavDropdown
                title={`👤 ${user?.name || "Account"}`}
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} to="/dashboard">
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/profile">
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/orders">
                  My Orders
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/appointments">
                  My Appointments
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/my-applications">
                  My Applications
                </NavDropdown.Item>
                {isStaff && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/admin">
                      Admin Panel
                    </NavDropdown.Item>
                  </>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
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
    </BootstrapNavbar>
  );
};

export default Navbar;
