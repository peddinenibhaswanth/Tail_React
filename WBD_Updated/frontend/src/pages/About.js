import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import useScrollReveal from "../hooks/useScrollReveal";

const About = () => {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef}>
      {/* Hero Section */}
      <section className="about-hero">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} className="text-center hero-animate-text">
              <span className="badge bg-white bg-opacity-25 text-white px-3 py-2 rounded-pill mb-3 fw-semibold">
                <i className="bi bi-info-circle me-1"></i> About Us
              </span>
              <h1 className="display-4 fw-bold text-white mb-3">About Tail Waggers</h1>
              <p className="lead text-white" style={{ opacity: 0.9 }}>
                We are passionate about connecting pets with loving families and
                providing comprehensive care for all animals.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="py-5">
        <Container>
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <Card className="border-0 shadow-sm overflow-hidden scroll-reveal">
                <Card.Body className="p-5">
                  <div className="d-flex align-items-center mb-4">
                    <div className="feature-icon me-3">
                      <i className="bi bi-bullseye fs-4"></i>
                    </div>
                    <h2 className="mb-0 fw-bold">Our Mission</h2>
                  </div>
                  <p className="mb-3" style={{ lineHeight: 1.8 }}>
                    At Tail Waggers, our mission is to create a world where every
                    pet finds a loving home and receives the care they deserve. We
                    believe that pets enrich our lives and bring immeasurable joy,
                    and we're committed to making pet adoption accessible and
                    rewarding.
                  </p>
                  <p className="mb-0" style={{ lineHeight: 1.8 }}>
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
        </Container>
      </section>

      {/* Values Section */}
      <section className="py-5" style={{ backgroundColor: 'var(--neutral-50)' }}>
        <Container>
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <div className="text-center mb-5 scroll-reveal">
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 fw-semibold">
                  <i className="bi bi-gem me-1"></i> What Drives Us
                </span>
                <h2 className="fw-bold mb-2">Our Values</h2>
                <div className="section-divider mx-auto"></div>
              </div>
              <Row className="g-4">
                <Col md={4} className="scroll-reveal" data-delay="0">
                  <Card className="value-card h-100 border-0 text-center">
                    <Card.Body className="p-4">
                      <div className="feature-icon mx-auto mb-3" style={{ background: 'linear-gradient(135deg, var(--danger-100), var(--danger-50))' }}>
                        <i className="bi bi-heart-fill fs-4" style={{ color: 'var(--danger-500)' }}></i>
                      </div>
                      <h5 className="fw-bold">Compassion</h5>
                      <p className="text-muted mb-0 small">
                        Every animal deserves love, care, and a safe home. We treat
                        every pet with kindness and respect.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="scroll-reveal" data-delay="1">
                  <Card className="value-card h-100 border-0 text-center">
                    <Card.Body className="p-4">
                      <div className="feature-icon mx-auto mb-3" style={{ background: 'linear-gradient(135deg, var(--primary-100), var(--primary-50))' }}>
                        <i className="bi bi-people-fill fs-4" style={{ color: 'var(--primary-500)' }}></i>
                      </div>
                      <h5 className="fw-bold">Trust</h5>
                      <p className="text-muted mb-0 small">
                        We build relationships based on transparency, honesty, and
                        reliable service for pets and their families.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="scroll-reveal" data-delay="2">
                  <Card className="value-card h-100 border-0 text-center">
                    <Card.Body className="p-4">
                      <div className="feature-icon mx-auto mb-3" style={{ background: 'linear-gradient(135deg, var(--warning-100), var(--warning-50))' }}>
                        <i className="bi bi-star-fill fs-4" style={{ color: 'var(--warning-500)' }}></i>
                      </div>
                      <h5 className="fw-bold">Excellence</h5>
                      <p className="text-muted mb-0 small">
                        From adoption to healthcare to products, we strive for the
                        highest quality in everything we do.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="counter-section py-5">
        <Container>
          <Row className="g-4 text-center scroll-reveal">
            <Col sm={6} md={3}>
              <div className="counter-number">500+</div>
              <div className="text-muted fw-semibold">Pets Adopted</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="counter-number">1000+</div>
              <div className="text-muted fw-semibold">Happy Families</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="counter-number">50+</div>
              <div className="text-muted fw-semibold">Vet Partners</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="counter-number">4.9★</div>
              <div className="text-muted fw-semibold">User Rating</div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* What We Offer Section */}
      <section className="offer-section py-5">
        <Container>
          <Row>
            <Col lg={10} className="mx-auto">
              <div className="text-center mb-5 scroll-reveal">
                <span className="badge bg-white bg-opacity-25 text-white px-3 py-2 rounded-pill mb-3 fw-semibold">
                  <i className="bi bi-grid me-1"></i> Services
                </span>
                <h2 className="text-white fw-bold mb-2">What We Offer</h2>
                <div className="section-divider mx-auto" style={{ background: 'rgba(255,255,255,0.4)' }}></div>
              </div>
              <Row className="g-4">
                <Col md={6} className="scroll-reveal" data-delay="0">
                  <div className="d-flex gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                      <i className="bi bi-heart-fill text-white fs-5"></i>
                    </div>
                    <div>
                      <h5 className="text-white fw-bold mb-1">Pet Adoption Services</h5>
                      <p className="mb-0 text-white small" style={{ opacity: 0.85 }}>
                        Browse profiles of pets waiting for homes, submit
                        applications, and receive guidance throughout the adoption process.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="scroll-reveal" data-delay="1">
                  <div className="d-flex gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                      <i className="bi bi-hospital text-white fs-5"></i>
                    </div>
                    <div>
                      <h5 className="text-white fw-bold mb-1">Veterinary Appointments</h5>
                      <p className="mb-0 text-white small" style={{ opacity: 0.85 }}>
                        Schedule checkups, vaccinations, and consultations with our
                        network of certified veterinarians.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="scroll-reveal" data-delay="2">
                  <div className="d-flex gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                      <i className="bi bi-bag-fill text-white fs-5"></i>
                    </div>
                    <div>
                      <h5 className="text-white fw-bold mb-1">Quality Pet Products</h5>
                      <p className="mb-0 text-white small" style={{ opacity: 0.85 }}>
                        Shop a wide range of food, toys, accessories, and healthcare
                        items for your beloved companions.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="scroll-reveal" data-delay="3">
                  <div className="d-flex gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                      <i className="bi bi-book text-white fs-5"></i>
                    </div>
                    <div>
                      <h5 className="text-white fw-bold mb-1">Resources & Support</h5>
                      <p className="mb-0 text-white small" style={{ opacity: 0.85 }}>
                        Access pet care guides, training tips, and expert advice to
                        help you provide the best care possible.
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About;
