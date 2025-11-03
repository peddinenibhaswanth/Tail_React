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
    <Card className="h-100 product-card">
      <Card.Img
        variant="top"
        src={image || "/images/default-product.jpg"}
        alt={name}
        style={{ height: "250px", objectFit: "cover" }}
      />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Badge bg="info">{category}</Badge>
          {stock === 0 && <Badge bg="danger">Out of Stock</Badge>}
        </div>

        <Card.Title className="mb-2">{name}</Card.Title>

        <div className="mb-2">
          <span className="text-warning">
            {"★".repeat(Math.round(rating || 0))}
            {"☆".repeat(5 - Math.round(rating || 0))}
          </span>
          <span className="text-muted ms-2">
            <small>({numReviews || 0} reviews)</small>
          </span>
        </div>

        <Card.Text className="h5 text-primary mb-3">
          {formatCurrency(price)}
        </Card.Text>

        <div className="mt-auto d-flex gap-2">
          <Link to={`/products/${_id}`} className="flex-grow-1">
            <Button variant="outline-primary" className="w-100">
              View Details
            </Button>
          </Link>
          {stock > 0 && (
            <Button
              variant="primary"
              onClick={handleAddToCart}
              disabled={!isAuthenticated}
            >
              Add to Cart
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
