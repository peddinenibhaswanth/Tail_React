import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  ListGroup,
  ProgressBar,
  Alert,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getProduct,
  getReviews,
} from "../../redux/slices/productSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import useAuth from "../../hooks/useAuth";
import Loading from "../../components/common/Loading";
import ReviewForm from "../../components/products/ReviewForm";
import { formatCurrency, formatDate } from "../../utils/formatters";
import * as productService from "../../api/productService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_URL}/uploads/products/${img}`;
};

const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f0f0f0' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E📦 No Image%3C/text%3E%3C/svg%3E";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, isSeller, isStaff } = useAuth();
  // Navigate back to the correct products list based on role
  const backPath = isSeller ? "/seller/products" : isStaff ? "/admin/products" : "/products";
  const {
    product: currentProduct,
    reviews,
    ratingBreakdown,
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.products);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [slideClass, setSlideClass] = useState("");
  const [canReview, setCanReview] = useState(false);

  const goToImage = (newIdx, direction) => {
    setSlideClass(direction === "next" ? "carousel-slide-from-right" : "carousel-slide-from-left");
    setSelectedImage(newIdx);
    // Clear class after animation completes so it can retrigger
    setTimeout(() => setSlideClass(""), 400);
  };
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});

  useEffect(() => {
    if (id) {
      dispatch(getProduct(id));
      dispatch(getReviews({ productId: id }));
    }
  }, [dispatch, id]);

  // Check if user can review this product
  useEffect(() => {
    const checkEligibility = async () => {
      if (isAuthenticated && id) {
        try {
          const response = await productService.checkReviewEligibility();
          const eligible = (response.data || []).find(
            (item) => item.productId === id || item.productId?.toString() === id
          );
          if (eligible) {
            setCanReview(true);
            setReviewOrderId(eligible.orderId);
          }
        } catch (err) {
          // Silently fail - just means user can't review
        }
      }
    };
    checkEligibility();
  }, [isAuthenticated, id]);

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

  const handleVoteHelpful = useCallback(
    async (reviewId) => {
      if (!isAuthenticated) {
        navigate("/login", { state: { from: `/products/${id}` } });
        return;
      }
      try {
        const res = await productService.voteHelpful(id, reviewId);
        setHelpfulVotes((prev) => ({
          ...prev,
          [reviewId]: {
            count: res.data.helpfulVotes,
            hasVoted: res.data.hasVoted,
          },
        }));
      } catch (err) {
        // Silently fail
      }
    },
    [id, isAuthenticated, navigate]
  );

  const handleReviewSuccess = () => {
    setCanReview(false);
    setShowReviewForm(false);
    // Refresh reviews
    dispatch(getReviews({ productId: id }));
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i
        key={index}
        className={`bi bi-star${
          index < Math.round(rating) ? "-fill" : ""
        } text-warning`}
      ></i>
    ));
  };

  if (isLoading && !currentProduct) {
    return <Loading />;
  }

  if (isError || !currentProduct) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {message || "Product not found"}
        </div>
        <Button variant="primary" onClick={() => navigate(backPath)}>
          Back to Products
        </Button>
      </Container>
    );
  }

  const product = currentProduct;
  const inStock = product.stock > 0;
  const allReviews =
    reviews && reviews.length > 0 ? reviews : product.reviews || [];
  const avgRating = product.averageRating || product.rating || 0;
  const totalReviews =
    product.totalReviews || product.numReviews || allReviews.length;

  // Handle both old products (only mainImage) and new products (images array)
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : product.mainImage && product.mainImage !== "default-product.jpg"
    ? [product.mainImage]
    : [];
  const hasMultipleImages = productImages.length > 1;

  return (
    <Container className="py-4">
      <Button
        variant="outline-secondary"
        className="mb-3 rounded-pill px-3"
        onClick={() => navigate(backPath)}
      >
        <i className="bi bi-arrow-left me-1"></i>Back to Products
      </Button>

      <Row>
        <Col lg={6}>
          <Card className="border-0 shadow-sm mb-3 position-relative" style={{ overflow: "hidden" }}>
            {/* Slide container — clips outgoing/incoming image */}
            <div style={{ height: "400px", overflow: "hidden", position: "relative" }}>
              <img
                key={selectedImage}
                src={getImageUrl(productImages[selectedImage]) || DEFAULT_IMAGE}
                alt={product.name}
                className={slideClass}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { if (e.target.src !== DEFAULT_IMAGE) e.target.src = DEFAULT_IMAGE; }}
              />
            </div>

            {/* Left/Right Arrow Navigation */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={() => {
                    const prev = selectedImage === 0 ? productImages.length - 1 : selectedImage - 1;
                    goToImage(prev, "prev");
                  }}
                  style={{
                    position: "absolute", top: "50%", left: "10px", transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%",
                    width: "40px", height: "40px", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    zIndex: 2, transition: "background 0.2s",
                  }}
                  aria-label="Previous image"
                >
                  <i className="bi bi-chevron-left fw-bold"></i>
                </button>
                <button
                  onClick={() => {
                    const next = selectedImage === productImages.length - 1 ? 0 : selectedImage + 1;
                    goToImage(next, "next");
                  }}
                  style={{
                    position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%",
                    width: "40px", height: "40px", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    zIndex: 2, transition: "background 0.2s",
                  }}
                  aria-label="Next image"
                >
                  <i className="bi bi-chevron-right fw-bold"></i>
                </button>
                {/* Image counter */}
                <span
                  style={{
                    position: "absolute", bottom: "10px", right: "10px",
                    background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: "12px",
                    padding: "2px 10px", fontSize: "0.8rem", zIndex: 2,
                  }}
                >
                  {selectedImage + 1} / {productImages.length}
                </span>
              </>
            )}
          </Card>

          {hasMultipleImages && (
            <div className="d-flex gap-2 mt-2 flex-wrap">
              {productImages.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img) || DEFAULT_IMAGE}
                  alt={`${product.name} ${idx + 1}`}
                  className="rounded"
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "cover",
                    cursor: "pointer",
                    border: selectedImage === idx ? "3px solid var(--bs-primary)" : "2px solid #dee2e6",
                    opacity: selectedImage === idx ? 1 : 0.7,
                    transition: "all 0.2s",
                  }}
                  onClick={() => goToImage(idx, idx > selectedImage ? "next" : "prev")}
                  onError={(e) => { if (e.target.src !== DEFAULT_IMAGE) e.target.src = DEFAULT_IMAGE; }}
                />
              ))}
            </div>
          )}
        </Col>

        <Col lg={6}>
          <div className="mb-3">
            <Badge
              bg="secondary"
              className="mb-2 rounded-pill px-3 py-2 text-uppercase"
              style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
            >
              {product.category}
            </Badge>
            <h2 className="fw-bold mb-2">{product.name}</h2>

            <div className="d-flex align-items-center mb-3">
              <div className="me-2">{renderStars(avgRating)}</div>
              <span className="fw-semibold me-1">
                {avgRating > 0 ? avgRating.toFixed(1) : "0"}
              </span>
              <span className="text-muted">
                ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>

            <h3
              className="fw-bold mb-3 d-flex align-items-center gap-2"
              style={{ color: "var(--primary-600)" }}
            >
              {formatCurrency(product.price)}
              {product.discountPercent > 0 && (
                <span
                  style={{
                    background: "linear-gradient(135deg, #e53e3e, #dd6b20)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    letterSpacing: "0.5px",
                    boxShadow: "0 2px 8px rgba(229,62,62,0.35)",
                    verticalAlign: "middle",
                  }}
                >
                  {product.discountPercent}% OFF
                </span>
              )}
            </h3>
          </div>

          <Card
            className="border-0 shadow-sm mb-3"
            style={{ backgroundColor: "var(--neutral-50)" }}
          >
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-info-circle me-2 text-primary"></i>Product
                Details
              </h5>
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

          {inStock && !isSeller && !isStaff && (
            <Card
              className="border-0 shadow-sm mb-3"
              style={{ borderLeft: "3px solid var(--primary-500)" }}
            >
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col xs={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">
                        Quantity:
                      </Form.Label>
                      <Form.Select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      >
                        {[...Array(Math.min(product.stock, 10))].map(
                          (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          )
                        )}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={8}>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 rounded-pill fw-semibold"
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
          <h4 className="fw-bold mb-4">
            <i className="bi bi-chat-dots me-2 text-primary"></i>Customer
            Reviews
          </h4>

          <Row className="mb-4">
            {/* Rating Summary */}
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <div
                    className="display-3 fw-bold"
                    style={{ color: "var(--primary-600)" }}
                  >
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </div>
                  <div className="mb-2">{renderStars(avgRating)}</div>
                  <p className="text-muted mb-3">
                    Based on {totalReviews}{" "}
                    {totalReviews === 1 ? "review" : "reviews"}
                  </p>

                  {/* Rating breakdown bars */}
                  {totalReviews > 0 && (
                    <div className="text-start">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingBreakdown[star] || 0;
                        const percent =
                          totalReviews > 0
                            ? Math.round((count / totalReviews) * 100)
                            : 0;
                        return (
                          <div
                            key={star}
                            className="d-flex align-items-center mb-1"
                          >
                            <span
                              className="text-muted small me-2"
                              style={{ minWidth: "15px" }}
                            >
                              {star}
                            </span>
                            <i className="bi bi-star-fill text-warning me-2 small"></i>
                            <ProgressBar
                              now={percent}
                              variant="warning"
                              className="flex-grow-1"
                              style={{ height: "8px" }}
                            />
                            <span
                              className="text-muted small ms-2"
                              style={{ minWidth: "25px" }}
                            >
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Write Review / Review List */}
            <Col md={8}>
              {/* Write Review Button or Form */}
              {canReview && !showReviewForm && (
                <Alert
                  variant="info"
                  className="d-flex align-items-center justify-content-between mb-3"
                >
                  <div>
                    <i className="bi bi-star me-2"></i>
                    You purchased this product! Share your experience.
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-pill"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <i className="bi bi-pencil me-1"></i>Write a Review
                  </Button>
                </Alert>
              )}

              {showReviewForm && canReview && (
                <div className="mb-3">
                  <ReviewForm
                    productId={id}
                    orderId={reviewOrderId}
                    productName={product.name}
                    onSuccess={handleReviewSuccess}
                  />
                </div>
              )}

              {/* Review CTA for authenticated non-purchasers */}
              {!canReview && !showReviewForm && (
                <div className="mb-3">
                  {!isAuthenticated ? (
                    <Alert variant="secondary" className="d-flex align-items-center justify-content-between">
                      <div>
                        <i className="bi bi-star me-2"></i>
                        Have this product? <strong>Log in</strong> to write a review.
                      </div>
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="rounded-pill ms-2"
                        onClick={() => navigate("/login", { state: { from: `/products/${id}` } })}
                      >
                        Log In
                      </Button>
                    </Alert>
                  ) : (
                    <Alert variant="light" className="border text-muted small">
                      <i className="bi bi-bag-check me-2"></i>
                      Only verified purchasers can write a review. Go to{" "}
                      <a href="/orders" className="text-decoration-none fw-semibold">your orders</a>{" "}
                      to review a product you have purchased.
                    </Alert>
                  )}
                </div>
              )}

              {/* Reviews List */}
              {allReviews.length > 0 ? (
                <div>
                  {allReviews.map((review) => {
                    const voteData = helpfulVotes[review._id];
                    const voteCount =
                      voteData !== undefined
                        ? voteData.count
                        : review.helpfulVotes || 0;
                    const hasVoted = voteData?.hasVoted || false;

                    return (
                      <Card
                        key={review._id}
                        className="mb-3 border-0 shadow-sm review-card"
                      >
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-start gap-3">
                            {/* Reviewer Avatar */}
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
                              style={{ width: "42px", height: "42px", background: "#e9ecef", fontSize: "1rem", fontWeight: 700, color: "#6c757d" }}
                            >
                              {review.user?.profilePicture ? (
                                <img
                                  src={`${API_URL}/uploads/users/${review.user.profilePicture}`}
                                  alt={review.user.name}
                                  style={{ width: "42px", height: "42px", objectFit: "cover" }}
                                  onError={(e) => { e.target.style.display = "none"; }}
                                />
                              ) : (
                                (review.user?.name || "A").charAt(0).toUpperCase()
                              )}
                            </div>
                            {/* Review Content */}
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <div className="d-flex align-items-center gap-2">
                                  <strong>{review.user?.name || "Anonymous"}</strong>
                                  {review.verifiedPurchase && (
                                    <Badge
                                      bg="success"
                                      className="rounded-pill"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      <i className="bi bi-patch-check-fill me-1"></i>
                                      Verified Purchase
                                    </Badge>
                                  )}
                                </div>
                                <small className="text-muted text-nowrap ms-2">
                                  {formatDate(review.createdAt)}
                                </small>
                              </div>
                              <div className="mb-1">{renderStars(review.rating)}</div>
                              {review.title && (
                                <h6 className="fw-bold mb-1">{review.title}</h6>
                              )}
                              {review.comment && (
                                <p className="mb-2 text-muted">{review.comment}</p>
                              )}
                              <Button
                                variant={hasVoted ? "primary" : "outline-secondary"}
                                size="sm"
                                className="rounded-pill mt-1"
                                onClick={() => handleVoteHelpful(review._id)}
                              >
                                <i className="bi bi-hand-thumbs-up me-1"></i>
                                Helpful {voteCount > 0 && `(${voteCount})`}
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-4 border-0 shadow-sm">
                  <Card.Body>
                    <i
                      className="bi bi-chat-square-text text-muted"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                    <p className="text-muted mt-2 mb-0">
                      No reviews yet. Be the first to review this product!
                    </p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
