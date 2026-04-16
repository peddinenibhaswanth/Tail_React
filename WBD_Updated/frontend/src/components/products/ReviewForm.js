import React, { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { addReview, resetProducts } from "../../redux/slices/productSlice";

const StarRatingInput = ({ rating, setRating, hover, setHover }) => {
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="d-flex align-items-center gap-2 mb-2">
      <div className="star-rating-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi bi-star${
              star <= (hover || rating) ? "-fill" : ""
            } review-star-input`}
            style={{
              fontSize: "1.8rem",
              cursor: "pointer",
              color: star <= (hover || rating) ? "#f5a623" : "#d1d5db",
              transition: "color 0.15s, transform 0.15s",
              transform: star <= hover ? "scale(1.15)" : "scale(1)",
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
      {(hover || rating) > 0 && (
        <span className="text-muted small fw-semibold">
          {labels[hover || rating]}
        </span>
      )}
    </div>
  );
};

const ReviewForm = ({ productId, orderId, productName, onSuccess }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.products);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }

    try {
      const result = await dispatch(
        addReview({
          productId,
          reviewData: {
            rating,
            title: title || `Review for ${productName}`,
            comment,
            orderId,
          },
        })
      ).unwrap();

      setSubmitted(true);
      setRating(0);
      setTitle("");
      setComment("");

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset success state after display
      setTimeout(() => {
        dispatch(resetProducts());
      }, 3000);
    } catch (err) {
      setError(err || "Failed to submit review. Please try again.");
    }
  };

  if (submitted) {
    return (
      <Alert variant="success" className="d-flex align-items-center">
        <i className="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>
          <strong>Thank you!</strong> Your review has been submitted
          successfully.
        </div>
      </Alert>
    );
  }

  return (
    <Card className="border-0 shadow-sm review-form-card">
      <Card.Body className="p-4">
        <h5 className="fw-bold mb-3">
          <i className="bi bi-pencil-square me-2 text-primary"></i>
          Write a Review
        </h5>

        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError("")}
            className="py-2"
          >
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Your Rating <span className="text-danger">*</span>
            </Form.Label>
            <StarRatingInput
              rating={rating}
              setRating={setRating}
              hover={hover}
              setHover={setHover}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Review Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Summarize your experience..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <Form.Text className="text-muted">
              {title.length}/100 characters
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Your Review</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Tell others about your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
            <Form.Text className="text-muted">
              {comment.length}/1000 characters
            </Form.Text>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="rounded-pill px-4"
            disabled={isLoading || rating === 0}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
                Submitting...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>
                Submit Review
              </>
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReviewForm;
