import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";

const About = () => {
  return (
    <Container className="py-5">
      {/* Header Section */}
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-4 mb-3">About Tail Waggers</h1>
          <p className="lead text-muted">
            We are passionate about connecting pets with loving families and
            providing comprehensive care for all animals.
          </p>
        </Col>
      </Row>

      {/* Mission Section */}
      <Row className="mb-5">
        <Col lg={10} className="mx-auto">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              <h2 className="mb-4">Our Mission</h2>
              <p className="mb-3">
                At Tail Waggers, our mission is to create a world where every
                pet finds a loving home and receives the care they deserve. We
                believe that pets enrich our lives and bring immeasurable joy,
                and we're committed to making pet adoption accessible and
                rewarding.
              </p>
              <p className="mb-0">
                Through our platform, we connect potential pet parents with
                animals in need, provide access to quality veterinary care, and
                offer a curated selection of premium pet supplies. We're more
                than just a service - we're a community of pet lovers dedicated
                to animal welfare.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Values Section */}
      <Row className="mb-5">
        <Col lg={10} className="mx-auto">
          <h2 className="text-center mb-4">Our Values</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 bg-light">
                <Card.Body className="text-center p-4">
                  <div className="fs-1 mb-3">❤️</div>
                  <h5>Compassion</h5>
                  <p className="text-muted mb-0">
                    Every animal deserves love, care, and a safe home. We treat
                    every pet with kindness and respect.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 bg-light">
                <Card.Body className="text-center p-4">
                  <div className="fs-1 mb-3">🤝</div>
                  <h5>Trust</h5>
                  <p className="text-muted mb-0">
                    We build relationships based on transparency, honesty, and
                    reliable service for pets and their families.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 bg-light">
                <Card.Body className="text-center p-4">
                  <div className="fs-1 mb-3">⭐</div>
                  <h5>Excellence</h5>
                  <p className="text-muted mb-0">
                    From adoption to healthcare to products, we strive for the
                    highest quality in everything we do.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* What We Offer Section */}
      <Row>
        <Col lg={10} className="mx-auto">
          <Card className="border-0 bg-primary text-white">
            <Card.Body className="p-5">
              <h2 className="mb-4">What We Offer</h2>
              <Row>
                <Col md={6} className="mb-3">
                  <h5>🐾 Pet Adoption Services</h5>
                  <p className="mb-0">
                    Browse profiles of pets waiting for homes, submit
                    applications, and receive guidance throughout the adoption
                    process.
                  </p>
                </Col>
                <Col md={6} className="mb-3">
                  <h5>🏥 Veterinary Appointments</h5>
                  <p className="mb-0">
                    Schedule checkups, vaccinations, and consultations with our
                    network of certified veterinarians.
                  </p>
                </Col>
                <Col md={6} className="mb-3 mb-md-0">
                  <h5>🛒 Quality Pet Products</h5>
                  <p className="mb-0">
                    Shop a wide range of food, toys, accessories, and healthcare
                    items for your beloved companions.
                  </p>
                </Col>
                <Col md={6}>
                  <h5>📚 Resources & Support</h5>
                  <p className="mb-0">
                    Access pet care guides, training tips, and expert advice to
                    help you provide the best care possible.
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default About;
