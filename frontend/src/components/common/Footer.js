import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Footer = () => {
  const { user, isAuthenticated, isAdmin, isCoAdmin, isSeller, isVeterinary, isOrganization } = useAuth();
  
  // Only customers (and unauthenticated visitors) should see shop/adopt/appointment links
  const isCustomerOrGuest = !isAuthenticated || (!isAdmin && !isCoAdmin && !isSeller && !isVeterinary && !isOrganization);

  return (
    <footer
      className="footer bg-dark text-light mt-auto"
      role="contentinfo"
    >
      <Container>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5 className="mb-3">
              <span className="fs-4">🐾</span> Tail Waggers
            </h5>
            <p className="text-light opacity-75 small" style={{ lineHeight: '1.8' }}>
              Connecting loving homes with pets in need. Find your perfect
              companion today and make a difference in an animal's life.
            </p>
            <div className="d-flex gap-2 mt-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon text-light"
                aria-label="Visit our Facebook page"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon text-light"
                aria-label="Visit our Twitter page"
              >
                <i className="bi bi-twitter"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon text-light"
                aria-label="Visit our Instagram page"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon text-light"
                aria-label="Visit our LinkedIn page"
              >
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </Col>

          <Col md={2} className="mb-3 mb-md-0">
            <h6 className="text-uppercase small fw-bold mb-3 text-light">
              Quick Links
            </h6>
            <ul className="list-unstyled small">
              <li className="mb-2">
                <Link
                  to="/"
                  className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-house me-2"></i>Home
                </Link>
              </li>
              {isCustomerOrGuest && (
                <>
                  <li className="mb-2">
                    <Link
                      to="/pets"
                      className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                    >
                      <i className="bi bi-heart me-2"></i>Adopt a Pet
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link
                      to="/products"
                      className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                    >
                      <i className="bi bi-shop me-2"></i>Shop
                    </Link>
                  </li>
                </>
              )}
              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-info-circle me-2"></i>About Us
                </Link>
              </li>
            </ul>
          </Col>

          {isCustomerOrGuest ? (
            <Col md={2} className="mb-3">
              <h6 className="text-uppercase small fw-bold mb-3 text-light">Services</h6>
              <ul className="list-unstyled small">
                <li className="mb-2">
                  <Link
                    to="/appointments/book"
                    className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                  >
                    <i className="bi bi-calendar-check me-2"></i>Book Appointment
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/pets"
                    className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                  >
                    <i className="bi bi-heart me-2"></i>Pet Adoption
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/products"
                    className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                  >
                    <i className="bi bi-bag me-2"></i>Pet Products
                  </Link>
                </li>
              </ul>
            </Col>
          ) : (
            <Col md={2} className="mb-3">
              <h6 className="text-uppercase small fw-bold mb-3 text-light">Dashboard</h6>
              <ul className="list-unstyled small">
                <li className="mb-2">
                  <Link
                    to="/dashboard"
                    className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                  >
                    <i className="bi bi-speedometer2 me-2"></i>My Dashboard
                  </Link>
                </li>
                {(isAdmin || isCoAdmin) && (
                  <li className="mb-2">
                    <Link
                      to="/admin"
                      className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                    >
                      <i className="bi bi-shield-lock me-2"></i>Admin Panel
                    </Link>
                  </li>
                )}
              </ul>
            </Col>
          )}

          <Col md={2} className="mb-3">
            <h6 className="text-uppercase small fw-bold mb-3 text-light">Account</h6>
            <ul className="list-unstyled small">
              {!isAuthenticated ? (
                <>
                  <li className="mb-2">
                    <Link
                      to="/login"
                      className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>Login
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link
                      to="/register"
                      className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                    >
                      <i className="bi bi-person-plus me-2"></i>Register
                    </Link>
                  </li>
                </>
              ) : (
                <li className="mb-2">
                  <Link
                    to="/dashboard"
                    className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                  >
                    <i className="bi bi-speedometer2 me-2"></i>Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </Col>

          <Col md={2} className="mb-3">
            <h6 className="text-uppercase small fw-bold mb-3 text-light">Support</h6>
            <ul className="list-unstyled small">
              <li className="mb-2">
                <Link
                  to="/contact"
                  className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-envelope me-2"></i>Contact Us
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-light opacity-75 text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-question-circle me-2"></i>FAQs
                </Link>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="border-secondary my-4" />

        <Row>
          <Col
            md={6}
            className="text-center text-md-start text-light opacity-75 small mb-2 mb-md-0"
          >
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Tail Waggers. All rights
              reserved.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end small">
            <Link
              to="/privacy"
              className="text-light opacity-75 text-decoration-none me-3"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-light opacity-75 text-decoration-none"
            >
              Terms of Service
            </Link>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
