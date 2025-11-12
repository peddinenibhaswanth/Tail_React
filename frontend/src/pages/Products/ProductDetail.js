import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  ListGroup,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProduct, resetProducts } from "../../redux/slices/productSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";
import { formatCurrency, formatDate } from "../../utils/formatters";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const {
    product: currentProduct,
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.products);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(getProduct(id));
    }
    return () => dispatch(resetProducts());
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    dispatch(
      addToCart({
        productId: currentProduct._id,
        quantity: quantity,
      })
    );
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i
        key={index}
        className={`bi bi-star${index < rating ? "-fill" : ""} text-warning`}
      ></i>
    ));
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !currentProduct) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {message || "Product not found"}
        </div>
        <Button variant="primary" onClick={() => navigate("/products")}>
          Back to Products
        </Button>
      </Container>
    );
  }

  const product = currentProduct;
  const inStock = product.stock > 0;

  return (
    <Container className="py-4">
      <Button
        variant="outline-secondary"
        className="mb-3"
        onClick={() => navigate("/products")}
      >
        ← Back to Products
      </Button>

      <Row>
        <Col lg={6}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Img
              variant="top"
              src={
                product.images?.[selectedImage] ||
                "/images/placeholder-product.png"
              }
              alt={product.name}
              style={{ height: "400px", objectFit: "cover" }}
            />
          </Card>

          {product.images && product.images.length > 1 && (
            <div className="d-flex gap-2">
              {product.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  className={`rounded ${
                    selectedImage === idx ? "border border-primary" : ""
                  }`}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedImage(idx)}
                />
              ))}
            </div>
          )}
        </Col>

        <Col lg={6}>
          <div className="mb-3">
            <Badge bg="secondary" className="mb-2">
              {product.category}
            </Badge>
            <h2 className="fw-bold mb-2">{product.name}</h2>

            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                {renderStars(Math.round(product.rating || 0))}
              </div>
              <span className="text-muted">
                ({product.numReviews || 0} reviews)
              </span>
            </div>

            <h3 className="text-primary fw-bold mb-3">
              {formatCurrency(product.price)}
            </h3>
          </div>

          <Card className="bg-light border-0 mb-3">
            <Card.Body>
              <h5 className="fw-bold mb-3">Product Details</h5>
              <p>{product.description}</p>
            </Card.Body>
          </Card>

          <ListGroup className="mb-3">
            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Availability:</span>
              <span className={inStock ? "text-success" : "text-danger"}>
                {inStock
                  ? `In Stock (${product.stock} available)`
                  : "Out of Stock"}
              </span>
            </ListGroup.Item>

            {product.brand && (
              <ListGroup.Item className="d-flex justify-content-between">
                <span className="fw-semibold">Brand:</span>
                <span>{product.brand}</span>
              </ListGroup.Item>
            )}

            <ListGroup.Item className="d-flex justify-content-between">
              <span className="fw-semibold">Seller:</span>
              <span>{product.seller?.name || "Unknown"}</span>
            </ListGroup.Item>
          </ListGroup>

          {inStock && (
            <Card className="border-primary mb-3">
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Quantity:</Form.Label>
                      <Form.Select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      >
                        {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={8}>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100"
                      onClick={handleAddToCart}
                    >
                      <i className="bi bi-cart-plus me-2"></i>
                      Add to Cart
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {!inStock && (
            <div className="alert alert-warning" role="alert">
              This product is currently out of stock
            </div>
          )}
        </Col>
      </Row>

      {/* Reviews Section */}
      <Row className="mt-5">
        <Col>
          <h4 className="fw-bold mb-4">Customer Reviews</h4>

          {product.reviews && product.reviews.length > 0 ? (
            <div>
              {product.reviews.map((review) => (
                <Card key={review._id} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <div>
                        <strong>{review.user?.name || "Anonymous"}</strong>
                        <div>{renderStars(review.rating)}</div>
                      </div>
                      <small className="text-muted">
                        {formatDate(review.createdAt)}
                      </small>
                    </div>
                    {review.comment && <p className="mb-0">{review.comment}</p>}
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-4">
              <Card.Body>
                <p className="text-muted mb-0">
                  No reviews yet. Be the first to review this product!
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
