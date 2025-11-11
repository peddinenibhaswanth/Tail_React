import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      className="footer bg-dark text-light py-4 mt-auto"
      role="contentinfo"
    >
      <Container>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5 className="mb-3">
              <span className="fs-4">🐾</span> Tail Waggers
            </h5>
            <p className="text-muted small">
              Connecting loving homes with pets in need. Find your perfect
              companion today and make a difference in an animal's life.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted"
                aria-label="Visit our Facebook page"
              >
                <i className="bi bi-facebook fs-5"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted"
                aria-label="Visit our Twitter page"
              >
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted"
                aria-label="Visit our Instagram page"
              >
                <i className="bi bi-instagram fs-5"></i>
              </a>
            </div>
          </Col>

          <Col md={2} className="mb-3 mb-md-0">
            <h6 className="text-uppercase small fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled small">
              <li className="mb-2">
                <Link
                  to="/"
                  className="text-muted text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-house me-2"></i>Home
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/pets"
                  className="text-muted text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-heart me-2"></i>Adopt a Pet
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/products"
                  className="text-muted text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-shop me-2"></i>Shop
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-muted text-decoration-none d-inline-flex align-items-center"
                >
                  <i className="bi bi-info-circle me-2"></i>About Us
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-3">
            <h6>Services</h6>
            <ul className="list-unstyled">
              <li>
                <Link
                  to="/appointments/book"
                  className="text-muted text-decoration-none"
                >
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/pets" className="text-muted text-decoration-none">
                  Pet Adoption
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-muted text-decoration-none"
                >
                  Pet Products
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-3">
            <h6>Account</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/login" className="text-muted text-decoration-none">
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-muted text-decoration-none"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-muted text-decoration-none"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-3">
            <h6>Support</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/contact" className="text-muted text-decoration-none">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted text-decoration-none">
                  FAQs
                </Link>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="border-secondary my-4" />

        <Row>
          <Col
            md={6}
            className="text-center text-md-start text-muted small mb-2 mb-md-0"
          >
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Tail Waggers. All rights
              reserved.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end text-muted small">
            <Link
              to="/privacy"
              className="text-muted text-decoration-none me-3"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted text-decoration-none">
              Terms of Service
            </Link>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
