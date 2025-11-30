import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { getPets, resetPets } from "../../redux/slices/petSlice";
import PetCard from "../../components/common/PetCard";
import Loading from "../../components/common/Loading";
import { PET_SPECIES, PET_SIZES, ADOPTION_STATUS } from "../../utils/constants";

const PetList = () => {
  const dispatch = useDispatch();
  const { pets, isLoading, isError, message } = useSelector(
    (state) => state.pets
  );

  // Separate search input state from applied filters
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    species: "",
    size: "",
    status: "available",
    minAge: "",
    maxAge: "",
    gender: "",
  });

  // Ref for search input to maintain focus
  const searchInputRef = useRef(null);

  // Debounce timer ref
  const debounceTimerRef = useRef(null);

  // Fetch pets when filters change (not on every keystroke)
  useEffect(() => {
    dispatch(getPets(filters));
    return () => dispatch(resetPets());
  }, [dispatch, filters]);

  // Debounced search handler
  const debouncedSearch = useCallback((value) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 500); // 500ms debounce delay
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle other filter changes (immediate, no debounce needed for dropdowns)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "search") {
      handleSearchChange(e);
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReset = () => {
    setSearchInput("");
    setFilters({
      search: "",
      species: "",
      size: "",
      status: "available",
      minAge: "",
      maxAge: "",
      gender: "",
    });
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Available Pets for Adoption</h2>
      </div>

      {/* Filters Section */}
      <div className="bg-light p-4 rounded mb-4">
        <Row className="g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  name="search"
                  value={searchInput}
                  onChange={handleSearchChange}
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
                    {species}
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
                    {size}
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
                <option value="Male">Male</option>
                <option value="Female">Female</option>
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
            <Button variant="secondary" onClick={handleReset} size="sm">
              Reset Filters
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

      {/* Pets Grid */}
      {pets && pets.length > 0 ? (
        <Row className="g-4">
          {pets.map((pet) => (
            <Col key={pet._id} xs={12} sm={6} lg={4} xl={3}>
              <PetCard pet={pet} />
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-search fs-1 text-muted"></i>
          <p className="text-muted mt-3">
            No pets found matching your criteria
          </p>
          <Button variant="primary" onClick={handleReset}>
            Clear Filters
          </Button>
        </div>
      )}
    </Container>
  );
};

export default PetList;
