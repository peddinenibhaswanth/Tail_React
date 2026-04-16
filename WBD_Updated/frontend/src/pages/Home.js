import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";

const Home = () => {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef}>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center min-vh-75 py-5">
            <Col lg={7} className="position-relative hero-animate-text" style={{ zIndex: 2 }}>
              <span className="badge bg-white text-primary px-3 py-2 mb-3 rounded-pill fw-semibold shadow-sm" style={{ animation: 'fadeInUp 0.6s ease' }}>
                <i className="bi bi-stars me-1"></i> #1 Pet Adoption Platform
              </span>
              <h1 className="display-3 fw-bold mb-3 text-white" style={{ lineHeight: 1.1 }}>
                Find Your Perfect{" "}
                <span className="text-gradient" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(135deg, #FFD166, #FF8C42)' }}>
                  Furry Friend
                </span>{" "}
                Today 🐾
              </h1>
              <p className="lead mb-4 text-white" style={{ opacity: 0.9, maxWidth: '540px', lineHeight: 1.7 }}>
                Your trusted partner for pet adoption, healthcare, and supplies.
                Give a loving pet their forever home and transform both your lives.
              </p>
              <div className="d-flex gap-3 flex-wrap mb-4">
                <Button
                  as={Link}
                  to="/pets"
                  variant="light"
                  size="lg"
                  className="px-4 py-3 fw-semibold rounded-pill shadow"
                >
                  <i className="bi bi-heart-fill me-2"></i>Adopt a Pet
                </Button>
                <Button
                  as={Link}
                  to="/products"
                  variant="outline-light"
                  size="lg"
                  className="px-4 py-3 fw-semibold rounded-pill"
                >
                  <i className="bi bi-bag me-2"></i>Shop Products
                </Button>
              </div>
              {/* Trust indicators */}
              <div className="d-flex gap-4 flex-wrap mt-2">
                <div className="trust-indicator text-white d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-heart-fill text-white"></i>
                  </div>
                  <div>
                    <div className="fw-bold small">500+</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Pets Adopted</div>
                  </div>
                </div>
                <div className="trust-indicator text-white d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-star-fill text-white"></i>
                  </div>
                  <div>
                    <div className="fw-bold small">4.9★</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>User Rating</div>
                  </div>
                </div>
                <div className="trust-indicator text-white d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-people-fill text-white"></i>
                  </div>
                  <div>
                    <div className="fw-bold small">1000+</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Happy Families</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={5} className="text-center mt-5 mt-lg-0 position-relative" style={{ zIndex: 2 }}>
              <div className="glass-card p-5 text-center">
                <div style={{ fontSize: '5rem', lineHeight: 1 }} className="mb-3">🐕</div>
                <h3 className="text-white fw-bold mb-2">Adopt, Don't Shop</h3>
                <p className="text-white mb-3" style={{ opacity: 0.85 }}>
                  Every pet deserves a loving home. Start your journey today.
                </p>
                <Button as={Link} to="/pets" variant="light" className="rounded-pill px-4 fw-semibold">
                  <i className="bi bi-arrow-right me-2"></i>Get Started
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
        {/* Floating paw prints */}
        <div className="floating-paw" style={{ top: '15%', left: '5%', animationDelay: '0s' }}>🐾</div>
        <div className="floating-paw" style={{ top: '60%', right: '8%', animationDelay: '2s' }}>🐾</div>
        <div className="floating-paw" style={{ top: '80%', left: '15%', animationDelay: '4s' }}>🐾</div>
        <div className="floating-paw" style={{ top: '25%', right: '15%', animationDelay: '1s' }}>🐾</div>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-white">
        <Container>
          <div className="text-center mb-5 scroll-reveal">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 fw-semibold">
              <i className="bi bi-lightbulb me-1"></i> Simple Process
            </span>
            <h2 className="section-title fw-bold mb-2">How It Works</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
              Bringing home your new best friend is just a few steps away
            </p>
            <div className="section-divider mx-auto"></div>
          </div>
          <Row className="g-4">
            <Col md={4} className="text-center scroll-reveal" data-delay="0">
              <div className="step-card p-4">
                <div className="step-number mx-auto">1</div>
                <h5 className="fw-bold mt-3 mb-2">Browse & Discover</h5>
                <p className="text-muted small mb-0">
                  Explore our wonderful selection of pets waiting for their forever homes. Filter by species, breed, and more.
                </p>
              </div>
            </Col>
            <Col md={4} className="text-center scroll-reveal" data-delay="1">
              <div className="step-card p-4">
                <div className="step-number mx-auto">2</div>
                <h5 className="fw-bold mt-3 mb-2">Apply & Connect</h5>
                <p className="text-muted small mb-0">
                  Submit your adoption application and book a visit. Our team will guide you through the process.
                </p>
              </div>
            </Col>
            <Col md={4} className="text-center scroll-reveal" data-delay="2">
              <div className="step-card p-4">
                <div className="step-number mx-auto">3</div>
                <h5 className="fw-bold mt-3 mb-2">Welcome Home!</h5>
                <p className="text-muted small mb-0">
                  Complete the adoption and bring home your new family member. We provide ongoing support too!
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5" style={{ backgroundColor: 'var(--neutral-50)' }}>
        <Container>
          <div className="text-center mb-5 scroll-reveal">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 fw-semibold">
              <i className="bi bi-award me-1"></i> Our Services
            </span>
            <h2 className="section-title fw-bold mb-2">Why Choose Tail Waggers?</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
              Everything your pet needs, all in one place
            </p>
            <div className="section-divider mx-auto"></div>
          </div>
          <Row className="g-4">
            <Col md={4} className="scroll-reveal" data-delay="0">
              <Card className="feature-card h-100 border-0 text-center">
                <Card.Body className="p-4">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-heart-fill fs-4"></i>
                  </div>
                  <Card.Title className="fw-bold">Pet Adoption</Card.Title>
                  <Card.Text className="text-muted small">
                    Find your perfect furry companion from our wide selection of
                    pets looking for loving homes.
                  </Card.Text>
                  <Button as={Link} to="/pets" variant="primary" size="sm" className="rounded-pill px-3 mt-2">
                    <i className="bi bi-arrow-right me-1"></i>Browse Pets
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="scroll-reveal" data-delay="1">
              <Card className="feature-card h-100 border-0 text-center">
                <Card.Body className="p-4">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-hospital fs-4"></i>
                  </div>
                  <Card.Title className="fw-bold">Veterinary Care</Card.Title>
                  <Card.Text className="text-muted small">
                    Book appointments with certified veterinarians for checkups,
                    vaccinations, and medical care.
                  </Card.Text>
                  <Button
                    as={Link}
                    to="/appointments"
                    variant="primary"
                    size="sm"
                    className="rounded-pill px-3 mt-2"
                  >
                    <i className="bi bi-arrow-right me-1"></i>Book Appointment
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="scroll-reveal" data-delay="2">
              <Card className="feature-card h-100 border-0 text-center">
                <Card.Body className="p-4">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-bag-fill fs-4"></i>
                  </div>
                  <Card.Title className="fw-bold">Pet Supplies</Card.Title>
                  <Card.Text className="text-muted small">
                    Shop quality food, toys, accessories, and healthcare
                    products for your beloved pets.
                  </Card.Text>
                  <Button as={Link} to="/products" variant="primary" size="sm" className="rounded-pill px-3 mt-2">
                    <i className="bi bi-arrow-right me-1"></i>Shop Now
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="cta-section scroll-reveal">
        <Container>
          <Row className="align-items-center justify-content-center text-center text-lg-start">
            <Col lg={8}>
              <h3 className="fw-bold text-white mb-2" style={{ fontSize: '1.75rem' }}>
                Ready to bring home a new friend? 🐾
              </h3>
              <p className="text-white mb-0" style={{ opacity: 0.9 }}>
                Browse our available pets and start your adoption journey today.
                Every adoption creates a happier world.
              </p>
            </Col>
            <Col lg={4} className="text-lg-end mt-4 mt-lg-0">
              <Button
                as={Link}
                to="/pets"
                variant="light"
                size="lg"
                className="rounded-pill px-4 py-3 fw-semibold shadow"
              >
                <i className="bi bi-heart-fill me-2 text-primary"></i>View Available Pets
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
