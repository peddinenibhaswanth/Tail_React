import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import { formatCurrency } from "../../utils/formatters";
import useAuth from "../../hooks/useAuth";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { _id, name, category, price, image, stock, rating, numReviews } =
    product;

  const handleAddToCart = () => {
    if (isAuthenticated) {
      dispatch(addToCart({ product: _id, quantity: 1 }));
    }
  };

  return (
    <Card className="h-100 product-card shadow-sm">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={image || "/images/default-product.jpg"}
          alt={`${name} product image`}
          style={{ height: "250px", objectFit: "cover" }}
          loading="lazy"
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
              disabled={!isAuthenticated}
              aria-label={`Add ${name} to cart`}
              title={
                !isAuthenticated ? "Please login to add items to cart" : ""
              }
            >
              <i className="bi bi-cart-plus me-2"></i>Add to Cart
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
