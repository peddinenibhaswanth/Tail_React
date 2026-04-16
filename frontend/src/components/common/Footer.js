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
            <p className="text-light opacity-75 small">
              Connecting loving homes with pets in need. Find your perfect
              companion today and make a difference in an animal's life.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light opacity-75"
                aria-label="Visit our Facebook page"
              >
                <i className="bi bi-facebook fs-5"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light opacity-75"
                aria-label="Visit our Twitter page"
              >
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light opacity-75"
                aria-label="Visit our Instagram page"
              >
                <i className="bi bi-instagram fs-5"></i>
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

          <Col md={2} className="mb-3">
            <h6 className="text-light fw-bold">Services</h6>
            <ul className="list-unstyled small">
              <li className="mb-2">
                <Link
                  to="/appointments/book"
                  className="text-light opacity-75 text-decoration-none"
                >
                  Book Appointment
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/pets"
                  className="text-light opacity-75 text-decoration-none"
                >
                  Pet Adoption
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/products"
                  className="text-light opacity-75 text-decoration-none"
                >
                  Pet Products
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-3">
            <h6 className="text-light fw-bold">Account</h6>
            <ul className="list-unstyled small">
              <li className="mb-2">
                <Link
                  to="/login"
                  className="text-light opacity-75 text-decoration-none"
                >
                  Login
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/register"
                  className="text-light opacity-75 text-decoration-none"
                >
                  Register
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/dashboard"
                  className="text-light opacity-75 text-decoration-none"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-3">
            <h6 className="text-light fw-bold">Support</h6>
            <ul className="list-unstyled small">
              <li className="mb-2">
                <Link
                  to="/contact"
                  className="text-light opacity-75 text-decoration-none"
                >
                  Contact Us
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-light opacity-75 text-decoration-none"
                >
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
