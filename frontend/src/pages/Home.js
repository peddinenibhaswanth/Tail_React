import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section
        className="bg-primary text-white py-5"
        style={{ minHeight: "500px" }}
      >
        <Container>
          <Row className="align-items-center py-5">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-3">
                Welcome to Tail Waggers 🐾
              </h1>
              <p className="lead mb-4">
                Your trusted partner for pet adoption, healthcare, and supplies.
                Find your perfect companion and give them a forever home today!
              </p>
              <div className="d-flex gap-3">
                <Button as={Link} to="/pets" variant="light" size="lg">
                  Adopt a Pet
                </Button>
                <Button
                  as={Link}
                  to="/products"
                  variant="outline-light"
                  size="lg"
                >
                  Shop Products
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center mt-4 mt-lg-0">
              <div className="bg-white rounded-3 p-5">
                <h2 className="text-dark">🐾</h2>
                <p className="text-muted">Find love, care, and joy</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <h2 className="text-center mb-5">Why Choose Us?</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body className="p-4">
                  <div className="fs-1 mb-3">🐶</div>
                  <Card.Title>Pet Adoption</Card.Title>
                  <Card.Text>
                    Find your perfect furry companion from our wide selection of
                    pets looking for loving homes.
                  </Card.Text>
                  <Button as={Link} to="/pets" variant="primary" size="sm">
                    Browse Pets
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body className="p-4">
                  <div className="fs-1 mb-3">🏥</div>
                  <Card.Title>Veterinary Care</Card.Title>
                  <Card.Text>
                    Book appointments with certified veterinarians for checkups,
                    vaccinations, and medical care.
                  </Card.Text>
                  <Button
                    as={Link}
                    to="/appointments"
                    variant="primary"
                    size="sm"
                  >
                    Book Appointment
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body className="p-4">
                  <div className="fs-1 mb-3">🛍️</div>
                  <Card.Title>Pet Supplies</Card.Title>
                  <Card.Text>
                    Shop quality food, toys, accessories, and healthcare
                    products for your beloved pets.
                  </Card.Text>
                  <Button as={Link} to="/products" variant="primary" size="sm">
                    Shop Now
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="bg-light py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={8}>
              <h3 className="mb-2">Ready to bring home a new friend?</h3>
              <p className="text-muted mb-0">
                Browse our available pets and start your adoption journey today.
              </p>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <Button as={Link} to="/pets" variant="primary" size="lg">
                View Available Pets
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
