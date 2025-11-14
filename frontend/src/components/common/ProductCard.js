import React, { useState } from "react";
import { Card, Badge, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, resetCart } from "../../redux/slices/cartSlice";
import { formatCurrency } from "../../utils/formatters";
import useAuth from "../../hooks/useAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { isLoading, isError, message } = useSelector((state) => state.cart);
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
  } = product;

  // Get image URL
  const getImageUrl = () => {
    const img = mainImage || image;
    if (!img) return "/images/default-product.jpg";
    if (img.startsWith("http")) return img;
    return `${API_URL}/uploads/products/${img}`;
  };

  const handleAddToCart = async () => {
    if (isAuthenticated) {
      try {
        const result = await dispatch(
          addToCart({ product: _id, quantity: 1 })
        ).unwrap();
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
      }
    }
  };

  return (
    <Card className="h-100 product-card shadow-sm">
      {showAlert && (
        <Alert
          variant={alertType}
          className="position-absolute w-100"
          style={{ top: 0, zIndex: 10 }}
          dismissible
          onClose={() => setShowAlert(false)}
        >
          {alertMessage}
        </Alert>
      )}
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={getImageUrl()}
          alt={`${name} product image`}
          style={{ height: "250px", objectFit: "cover" }}
          loading="lazy"
          onError={(e) => {
            e.target.src = "/images/default-product.jpg";
          }}
        />
        {stock === 0 && (
          <div className="position-absolute top-0 end-0 m-2">
            <Badge bg="danger" className="px-3 py-2">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
      <Card.Body className="d-flex flex-column">
        <div className="mb-2">
          <Badge bg="info" className="text-uppercase small">
            {category}
          </Badge>
        </div>

        <Card.Title className="mb-2 text-truncate" title={name}>
          {name}
        </Card.Title>

        <div
          className="mb-2"
          aria-label={`Rating: ${rating || 0} out of 5 stars`}
        >
          <span className="text-warning" role="img" aria-label="star rating">
            {"★".repeat(Math.round(rating || 0))}
            {"☆".repeat(5 - Math.round(rating || 0))}
          </span>
          <span className="text-muted ms-2">
            <small>({numReviews || 0})</small>
          </span>
        </div>

        <Card.Text className="h5 text-primary fw-bold mb-3">
          {formatCurrency(price)}
        </Card.Text>

        <div className="mt-auto d-grid gap-2">
          <Link to={`/products/${_id}`}>
            <Button
              variant="outline-primary"
              className="w-100"
              aria-label={`View details for ${name}`}
            >
              <i className="bi bi-eye me-2"></i>View Details
            </Button>
          </Link>
          {stock > 0 && (
            <Button
              variant="primary"
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
