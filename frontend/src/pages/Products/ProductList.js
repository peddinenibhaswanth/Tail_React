import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { getProducts, reset } from "../../redux/slices/productSlice";
import ProductCard from "../../components/common/ProductCard";
import Loading from "../../components/common/Loading";
import { PRODUCT_CATEGORIES } from "../../utils/constants";
import { useDebounce } from "../../hooks/useDebounce";

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
    sortBy: "createdAt",
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    const queryFilters = { ...filters, search: debouncedSearch };
    dispatch(getProducts(queryFilters));
    return () => dispatch(reset());
  }, [
    dispatch,
    debouncedSearch,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.sortBy,
  ]);

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
      sortBy: "createdAt",
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Pet Products</h2>
      </div>

      {/* Filters Section */}
      <div className="bg-light p-4 rounded mb-4">
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

          <Col md={3}>
            <Form.Group>
              <Form.Label>Sort By</Form.Label>
              <Form.Select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
              >
                <option value="createdAt">Newest First</option>
                <option value="-createdAt">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="-name">Name: Z to A</option>
                <option value="-rating">Top Rated</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
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
              variant="secondary"
              onClick={handleReset}
              className="mt-4 w-100"
            >
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

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <>
          <div className="mb-3 text-muted">
            Found {products.length} product{products.length !== 1 ? "s" : ""}
          </div>
          <Row className="g-4">
            {products.map((product) => (
              <Col key={product._id} xs={12} sm={6} md={4} lg={3}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-box-seam fs-1 text-muted"></i>
          <p className="text-muted mt-3">
            No products found matching your criteria
          </p>
          <Button variant="primary" onClick={handleReset}>
            Clear Filters
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ProductList;
