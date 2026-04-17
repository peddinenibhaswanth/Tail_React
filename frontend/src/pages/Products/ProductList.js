import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "../../redux/slices/productSlice";
import ProductCard from "../../components/common/ProductCard";
import SkeletonCard from "../../components/common/SkeletonCard";
import Loading from "../../components/common/Loading";
import { PRODUCT_CATEGORIES } from "../../utils/constants";

const ProductList = () => {
  const dispatch = useDispatch();
  const { products, isLoading, isError, message } = useSelector(
    (state) => state.products
  );

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    inStock: false,
  });

  // Track if this is initial load - only true when no cached data exists
  const initialLoadRef = useRef(products.length === 0);
  const [showInitialLoading, setShowInitialLoading] = useState(products.length === 0);

  // Debounce timer ref
  const debounceRef = useRef(null);

  // Fetch products when filters change
  useEffect(() => {
    // Clear existing timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      dispatch(getProducts(filters)).then(() => {
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

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
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
          <h2 className="fw-bold mb-1">Pet Products</h2>
          <p className="text-muted mb-0 small">Quality supplies for your beloved pets</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filter-section mb-4">
        <Row className="g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Search Products</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search by name or description..."
                />
              </InputGroup>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Min Price</Form.Label>
              <Form.Control
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="$0"
                min="0"
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Max Price</Form.Label>
              <Form.Control
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="$1000"
                min="0"
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group className="mt-4">
              <Form.Check
                type="checkbox"
                name="inStock"
                label="In Stock Only"
                checked={filters.inStock}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Button
              variant="outline-secondary"
              onClick={handleReset}
              className="mt-4 w-100 rounded-pill"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
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
      {isLoading && !showInitialLoading && products.length === 0 && (
        <Row className="g-4">
          {[...Array(8)].map((_, i) => (
            <Col key={i} xs={12} sm={6} md={4} lg={3}>
              <SkeletonCard type="product" />
            </Col>
          ))}
        </Row>
      )}

      {/* Products Grid - show even during background refetch if data exists */}
      {products && products.length > 0 ? (
        <>
          <div className="mb-3 text-muted">
            Found {products.length} product{products.length !== 1 ? "s" : ""}
          </div>
          <Row className="g-4">
            {products.map((product, index) => (
              <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="card-stagger-enter visible" style={{ transitionDelay: `${index * 0.07}s` }}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </>
      ) : !isLoading || products.length > 0 ? null : (
        <div className="empty-state text-center py-5">
          <div className="mb-3" style={{ fontSize: '3rem' }}>📦</div>
          <h5 className="fw-bold text-muted">No Products Found</h5>
          <p className="text-muted small">
            No products found matching your criteria. Try adjusting your filters.
          </p>
          <Button variant="primary" onClick={handleReset} className="rounded-pill px-4">
            <i className="bi bi-arrow-counterclockwise me-1"></i>Clear Filters
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ProductList;
