import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer bg-dark text-light py-4 mt-auto">
      <Container>
        <Row>
          <Col md={4} className="mb-3">
            <h5>Tail Adoption Platform</h5>
            <p className="text-muted">
              Connecting loving homes with pets in need. Find your perfect
              companion today.
            </p>
          </Col>

          <Col md={2} className="mb-3">
            <h6>Quick Links</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-muted text-decoration-none">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/pets" className="text-muted text-decoration-none">
                  Adopt a Pet
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-muted text-decoration-none"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted text-decoration-none">
                  About Us
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

        <hr className="border-secondary" />

        <Row>
          <Col className="text-center text-muted">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Tail Adoption Platform. All
              rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
