import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { getPets } from "../../redux/slices/petSlice";
import PetCard from "../../components/common/PetCard";
import SkeletonCard from "../../components/common/SkeletonCard";
import Loading from "../../components/common/Loading";
import {
  PET_SPECIES,
  PET_SIZES,
  PET_GENDERS,
  ADOPTION_STATUS,
} from "../../utils/constants";

const PetList = () => {
  const dispatch = useDispatch();
  const { pets, isLoading, isError, message } = useSelector(
    (state) => state.pets
  );

  const [filters, setFilters] = useState({
    search: "",
    species: "",
    size: "",
    status: "available",
    gender: "",
  });

  // Track if this is initial load - only true when no cached data exists
  const initialLoadRef = useRef(pets.length === 0);
  const [showInitialLoading, setShowInitialLoading] = useState(pets.length === 0);

  // Debounce timer ref
  const debounceRef = useRef(null);

  // Fetch pets when filters change
  useEffect(() => {
    // Clear existing timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      dispatch(getPets(filters)).then(() => {
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
          setShowInitialLoading(false);
        }
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [dispatch, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      species: "",
      size: "",
      status: "available",
      gender: "",
    });
  };

  // Only show full loading screen on initial load
  if (showInitialLoading && isLoading) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Available Pets for Adoption</h2>
          <p className="text-muted mb-0 small">Find your perfect furry companion</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filter-section mb-4">
        <Row className="g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search by name or breed..."
                />
              </InputGroup>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Species</Form.Label>
              <Form.Select
                name="species"
                value={filters.species}
                onChange={handleFilterChange}
              >
                <option value="">All Species</option>
                {PET_SPECIES.map((species) => (
                  <option key={species} value={species}>
                    {species.charAt(0).toUpperCase() + species.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Size</Form.Label>
              <Form.Select
                name="size"
                value={filters.size}
                onChange={handleFilterChange}
              >
                <option value="">All Sizes</option>
                {PET_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Gender</Form.Label>
              <Form.Select
                name="gender"
                value={filters.gender}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {PET_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {Object.entries(ADOPTION_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={12}>
            <Button variant="outline-secondary" onClick={handleReset} size="sm" className="rounded-pill px-3">
              <i className="bi bi-arrow-counterclockwise me-1"></i>Reset Filters
            </Button>
          </Col>
        </Row>
      </div>

      {/* Error Message */}
      {isError && (
        <div className="alert alert-danger" role="alert">
          {message}
        </div>
      )}

      {/* Loading Skeleton - only when no cached data */}
      {isLoading && !showInitialLoading && pets.length === 0 && (
        <Row className="g-4">
          {[...Array(8)].map((_, i) => (
            <Col key={i} xs={12} sm={6} lg={4} xl={3}>
              <SkeletonCard type="pet" />
            </Col>
          ))}
        </Row>
      )}

      {/* Pets Grid - show even during background refetch if data exists */}
      {pets && pets.length > 0 ? (
        <Row className="g-4">
          {pets.map((pet, index) => (
            <Col key={pet._id} xs={12} sm={6} lg={4} xl={3} className="card-stagger-enter visible" style={{ transitionDelay: `${index * 0.07}s` }}>
              <PetCard pet={pet} />
            </Col>
          ))}
        </Row>
      ) : !isLoading || pets.length > 0 ? null : (
        <div className="empty-state text-center py-5">
          <div className="mb-3" style={{ fontSize: '3rem' }}>🐾</div>
          <h5 className="fw-bold text-muted">No Pets Found</h5>
          <p className="text-muted small">
            No pets found matching your criteria. Try adjusting your filters.
          </p>
          <Button variant="primary" onClick={handleReset} className="rounded-pill px-4">
            <i className="bi bi-arrow-counterclockwise me-1"></i>Clear Filters
          </Button>
        </div>
      )}
    </Container>
  );
};

export default PetList;
