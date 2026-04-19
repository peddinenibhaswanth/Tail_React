import React, { useState } from "react";
import { Card, Badge, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, resetCart } from "../../redux/slices/cartSlice";
import { formatCurrency } from "../../utils/formatters";
import useAuth from "../../hooks/useAuth";
import { resolveImageUrl } from "../../utils/imageUrl";

// Inline SVG placeholder to prevent infinite error loops
const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='250' viewBox='0 0 300 250'%3E%3Crect fill='%23f0f0f0' width='300' height='250'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E📦 No Image%3C/text%3E%3C/svg%3E";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");

  const {
    _id,
    name,
    category,
    price,
    mainImage,
    image,
    stock,
    rating,
    numReviews,
    averageRating,
    totalReviews,
    discountPercent,
  } = product;

  const displayRating = averageRating || rating || 0;
  const displayReviewCount = totalReviews || numReviews || 0;

  // Get image URL
  const getImageUrl = () => {
    const img = mainImage || image;
    if (!img) return DEFAULT_PRODUCT_IMAGE;
    return resolveImageUrl(img, "products") || DEFAULT_PRODUCT_IMAGE;
  };

  const handleAddToCart = async () => {
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        await dispatch(addToCart({ product: _id, quantity: 1 })).unwrap();
        setAlertType("success");
        setAlertMessage("Item added to cart!");
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          dispatch(resetCart());
        }, 3000);
      } catch (error) {
        setAlertType("danger");
        setAlertMessage(error || "Failed to add item to cart");
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          dispatch(resetCart());
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="h-100 product-card border-0 shadow-sm overflow-hidden">
      {showAlert && (
        <Alert
          variant={alertType}
          className="position-absolute w-100 rounded-0 mb-0"
          style={{ top: 0, zIndex: 10 }}
          dismissible
          onClose={() => setShowAlert(false)}
        >
          {alertMessage}
        </Alert>
      )}
      <Link to={`/products/${_id}`} className="text-decoration-none">
        <div className="position-relative overflow-hidden">
          <Card.Img
            variant="top"
            src={getImageUrl()}
            alt={`${name} product image`}
            style={{ height: "250px", objectFit: "cover", transition: "transform 0.4s ease" }}
            loading="lazy"
            onError={(e) => {
              if (e.target.src !== DEFAULT_PRODUCT_IMAGE) {
                e.target.src = DEFAULT_PRODUCT_IMAGE;
              }
            }}
          />
          {discountPercent > 0 && (
            <div className="position-absolute top-0 start-0 m-2">
              <span
                style={{
                  background: "linear-gradient(135deg, #e53e3e, #dd6b20)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.4px",
                  boxShadow: "0 2px 6px rgba(229,62,62,0.4)",
                }}
              >
                {discountPercent}% OFF
              </span>
            </div>
          )}
          {stock === 0 && (
            <div className="position-absolute top-0 end-0 m-2">
              <Badge bg="danger" className="px-3 py-2 rounded-pill fw-semibold" style={{ fontSize: '0.7rem' }}>
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <Card.Body className="d-flex flex-column p-3">
        <div className="mb-2">
          <Badge bg="info" className="text-uppercase small rounded-pill px-2">
            {category}
          </Badge>
        </div>

        <Card.Title className="mb-2 text-truncate fw-bold" title={name}>
          <Link to={`/products/${_id}`} className="text-decoration-none text-dark">
            {name}
          </Link>
        </Card.Title>

        <div className="mb-2 d-flex align-items-center gap-1">
          <span className="text-warning star-fill-animate" style={{ fontSize: "0.9rem", letterSpacing: "1px" }}>
            {[1,2,3,4,5].map((s) => (
              <i key={s} className={`bi bi-star${s <= Math.round(displayRating) ? "-fill" : (s - 0.5 <= displayRating ? "-half" : "")}`}></i>
            ))}
          </span>
          <span className="fw-semibold small" style={{ color: "#f5a623" }}>
            {displayRating > 0 ? displayRating.toFixed(1) : ""}
          </span>
          <span className="text-muted small">({displayReviewCount})</span>
        </div>

        <Card.Text className="h5 fw-bold mb-3" style={{ color: 'var(--primary-600)' }}>
          {formatCurrency(price)}
        </Card.Text>

        <div className="mt-auto d-grid gap-2">
          <Link
            to={`/products/${_id}`}
            className="btn btn-outline-primary rounded-pill fw-semibold"
          >
            <i className="bi bi-eye me-2"></i>View Details
          </Link>
          {stock > 0 && (
            <Button
              variant="primary"
              className="rounded-pill fw-semibold"
              onClick={handleAddToCart}
              disabled={!isAuthenticated || isLoading}
              aria-label={`Add ${name} to cart`}
              title={
                !isAuthenticated ? "Please login to add items to cart" : ""
              }
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Adding...
                </>
              ) : (
                <>
                  <i className="bi bi-cart-plus me-2"></i>Add to Cart
                </>
              )}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
