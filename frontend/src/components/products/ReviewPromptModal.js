import React, { useState, useEffect } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useAuth from "../../hooks/useAuth";
import * as productService from "../../api/productService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getProductImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_URL}/uploads/products/${img}`;
};

const ReviewPromptModal = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { orders } = useSelector((state) => state.orders);

  const [show, setShow] = useState(false);
  const [unreviewedItems, setUnreviewedItems] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkForUnreviewedItems = async () => {
      if (!isAuthenticated || dismissed) return;

      // Check persistent "never ask again" preference (per user)
      const neverAskKey = `reviewPromptNeverAsk_${user?._id}`;
      const neverAsk = user?._id && localStorage.getItem(neverAskKey);
      if (neverAsk) return;

      // Check if already dismissed in this session
      const sessionDismissed = sessionStorage.getItem("reviewPromptDismissed");
      if (sessionDismissed) return;

      // Client-side guard: if Redux orders are loaded and none are delivered, skip API call
      if (orders && orders.length > 0 && !orders.some((o) => o.status === "delivered")) {
        return;
      }

      try {
        const response = await productService.checkReviewEligibility();
        const items = response.data || [];

        if (items.length > 0) {
          setUnreviewedItems(items);
          setShow(true);
        }
      } catch (err) {
        // Silently fail
      }
    };

    // Small delay to not block initial page load
    const timer = setTimeout(checkForUnreviewedItems, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, dismissed, orders, user]);

  const handleClose = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("reviewPromptDismissed", "true");
  };

  const handleNeverAsk = () => {
    setShow(false);
    setDismissed(true);
    if (user?._id) {
      localStorage.setItem(`reviewPromptNeverAsk_${user._id}`, "true");
    }
  };

  const handleReviewNow = (productId) => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("reviewPromptDismissed", "true");
    navigate(`/products/${productId}#reviews`);
  };

  if (!show || unreviewedItems.length === 0) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="md">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          <i className="bi bi-star text-warning me-2"></i>
          Rate Your Purchase!
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">
          You have {unreviewedItems.length} delivered{" "}
          {unreviewedItems.length === 1 ? "item" : "items"} waiting for your
          review. Your feedback helps other shoppers!
        </p>

        <div
          className="review-prompt-items"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {unreviewedItems.slice(0, 5).map((item, index) => (
            <div
              key={`${item.productId}-${index}`}
              className="d-flex align-items-center justify-content-between p-3 mb-2 rounded"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <div className="d-flex align-items-center">
                <div
                  className="rounded me-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#e9ecef",
                    overflow: "hidden",
                  }}
                >
                  {item.productImage ? (
                    <img
                      src={getProductImageUrl(item.productImage)}
                      alt={item.productName}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    />
                  ) : null}
                  <span style={{ display: item.productImage ? "none" : "flex" }} className="align-items-center justify-content-center w-100 h-100">
                    <i className="bi bi-box text-muted"></i>
                  </span>
                </div>
                <div>
                  <div className="fw-semibold small">{item.productName}</div>
                  <small className="text-muted">
                    Order #{item.orderNumber?.slice(-8) || "N/A"}
                  </small>
                </div>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                className="rounded-pill"
                onClick={() => handleReviewNow(item.productId)}
              >
                <i className="bi bi-star me-1"></i>Review
              </Button>
            </div>
          ))}
          {unreviewedItems.length > 5 && (
            <p className="text-muted small text-center mt-2">
              and {unreviewedItems.length - 5} more items...
            </p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
        <Button
          variant="link"
          size="sm"
          className="text-muted text-decoration-none p-0"
          onClick={handleNeverAsk}
        >
          Don't ask again
        </Button>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-pill"
            onClick={handleClose}
          >
            Maybe Later
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="rounded-pill"
            onClick={() => handleReviewNow(unreviewedItems[0].productId)}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Review First Item
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ReviewPromptModal;
