import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { getOrder, cancelOrder } from "../../redux/slices/orderSlice";
import useAuth from "../../hooks/useAuth";
import ReviewForm from "../../components/products/ReviewForm";
import * as productService from "../../api/productService";

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get("action") === "review";
  const { order, isLoading, isError, message } = useSelector(
    (state) => state.orders
  );
  const { isAdmin, isSeller } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [alreadyReviewedProducts, setAlreadyReviewedProducts] = useState(new Set());
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  // Determine correct back link based on user role
  const getBackToOrdersLink = () => {
    if (isAdmin) return "/admin/orders";
    if (isSeller) return "/seller/orders";
    return "/orders"; // Default for customers
  };

  const handleCancelOrder = async () => {
    setCancelLoading(true);
    await dispatch(cancelOrder(id));
    setCancelLoading(false);
    setShowCancelModal(false);
    // Reload order to show updated status
    dispatch(getOrder(id));
  };

  const canCustomerCancel = !isAdmin && !isSeller && order?.status === "pending";

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return statusColors[status] || "secondary";
  };

  useEffect(() => {
    if (id) {
      dispatch(getOrder(id));
    }
  }, [dispatch, id]);

  // Check which items have already been reviewed (only for delivered orders)
  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (order && order?.status === "delivered" && !isAdmin && !isSeller) {
        try {
          const response = await productService.checkReviewEligibility();
          const eligible = (response.data || []).filter(
            (item) => item.orderId === id || item.orderId?.toString() === id
          );
          const eligibleProductIds = new Set(
            eligible.map((item) => item.productId?.toString())
          );
          
          // Build set of already-reviewed products for this order
          const allProductIds = (order.items || []).map(
            (item) => (item.product?._id || item.product)?.toString()
          );
          const alreadyReviewed = new Set(
            allProductIds.filter((pid) => pid && !eligibleProductIds.has(pid))
          );
          setAlreadyReviewedProducts(alreadyReviewed);
          
          // Auto-open first reviewable product if coming from Review button
          if (isReviewMode && eligibleProductIds.size > 0) {
            const firstEligible = eligibleProductIds.values().next().value;
            setReviewingProduct(firstEligible);
          }
        } catch (err) {
          // Even if API fails, allow reviews - server will reject duplicates
          
          // Auto-open first product if in review mode
          if (isReviewMode && order.items?.length > 0) {
            const firstProduct = (order.items[0].product?._id || order.items[0].product)?.toString();
            setReviewingProduct(firstProduct);
          }
        }
      }
    };
    checkReviewEligibility();
  }, [order, id, isAdmin, isSeller, isReviewMode]);

  const handleReviewSuccess = (productId) => {
    setReviewingProduct(null);
    setAlreadyReviewedProducts((prev) => new Set([...prev, productId?.toString()]));
    setReviewedProducts((prev) => new Set([...prev, productId?.toString()]));
  };

  if (isLoading || !order) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {message || "Failed to load order."}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1"><i className="bi bi-receipt me-2"></i>Order Details</h2>
          <p className="text-muted mb-0">View your order information</p>
        </div>
        <Link to={getBackToOrdersLink()} className="btn btn-outline-secondary btn-sm rounded-pill">
          <i className="bi bi-arrow-left me-2"></i>Back to Orders
        </Link>
      </div>

      {/* Review mode banner */}
      {isReviewMode && order?.status === "delivered" && !isAdmin && !isSeller && (
        <div className="alert alert-info d-flex align-items-center mb-3" role="alert">
          <i className="bi bi-star-fill me-2 fs-5"></i>
          <div>
            <strong>Review Mode</strong> — Click the <span className="badge bg-warning text-dark">Review</span> button next to any product below to write your review.
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-box me-2"></i>Items</h5>
              {order.items?.map((item) => {
                const productId = item.product?._id || item.product;
                const productIdStr = productId?.toString();
                const isAlreadyReviewed = alreadyReviewedProducts.has(productIdStr);
                const hasJustReviewed = reviewedProducts.has(productIdStr);
                const canReview = order.status === "delivered" && !isAlreadyReviewed && !hasJustReviewed;
                const isReviewing = reviewingProduct === productIdStr;

                return (
                  <div key={item._id}>
                    <div className="d-flex justify-content-between border-bottom py-2">
                      <div className="d-flex align-items-center">
                        <div>
                          <div className="fw-semibold">
                            <Link
                              to={`/products/${productIdStr}`}
                              className="text-decoration-none"
                            >
                              {item.name || item.product?.name}
                            </Link>
                          </div>
                          <small className="text-muted">
                            Qty: {item.quantity} × ₹
                            {(item.price || 0).toFixed(2)}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span>
                          ₹{(item.quantity * (item.price || 0)).toFixed(2)}
                        </span>
                        {!isAdmin && !isSeller && (
                          <>
                            {canReview && !isReviewing && (
                              <button
                                className="btn btn-outline-warning btn-sm rounded-pill"
                                onClick={() => setReviewingProduct(productIdStr)}
                              >
                                <i className="bi bi-star me-1"></i>Review
                              </button>
                            )}
                            {(hasJustReviewed || isAlreadyReviewed) && (
                              <span className="badge bg-success rounded-pill">
                                <i className="bi bi-check-circle me-1"></i>
                                Reviewed
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline Review Form */}
                    {isReviewing && (
                      <div className="p-3 bg-light rounded mb-2">
                        <ReviewForm
                          productId={productIdStr}
                          orderId={id}
                          productName={item.name || item.product?.name}
                          onSuccess={() => handleReviewSuccess(productIdStr)}
                        />
                        <button
                          className="btn btn-sm btn-outline-secondary mt-2 rounded-pill"
                          onClick={() => setReviewingProduct(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <p className="text-muted mb-0">
                  No items found for this order.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-clipboard-data me-2"></i>Summary</h5>
              <p className="mb-1">
                <strong>Order #:</strong>{" "}
                {order.orderNumber || order._id.slice(-8)}
              </p>
              <p className="mb-1">
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <p className="mb-1">
                <strong>Status:</strong>{" "}
                <span
                  className={`badge rounded-pill text-uppercase bg-${getStatusBadge(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </p>
              <p className="mb-1">
                <strong>Payment:</strong>{" "}
                <span className="text-uppercase">
                  {order.paymentMethod || "COD"}
                </span>
                {" - "}
                <span
                  className={`badge bg-${
                    order.paymentStatus === "paid" ? "success" : "warning"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </p>
              <hr />
              <p className="mb-1">
                <strong>Subtotal:</strong> ₹{(order.subtotal || 0).toFixed(2)}
              </p>
              <p className="mb-1">
                <strong>Shipping:</strong> ₹{(order.shipping || 0).toFixed(2)}
              </p>
              <p className="mb-1">
                <strong>Tax (GST):</strong> ₹{(order.tax || 0).toFixed(2)}
              </p>
              <hr />
              <p className="mb-0 h5">
                <strong>Total:</strong> ₹{(order.total || 0).toFixed(2)}
              </p>
              
              {/* Customer Cancel Order Button */}
              {canCustomerCancel && (
                <>
                  <hr />
                  <button
                    className="btn btn-danger btn-sm w-100 rounded-pill"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <i className="bi bi-x-circle me-2"></i>Cancel Order
                  </button>
                  <small className="text-muted d-block mt-2">
                    You can only cancel pending orders before they are processed.
                  </small>
                </>
              )}
            </div>
          </div>

          {order.shippingAddress && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title"><i className="bi bi-truck me-2"></i>Shipping Information</h5>
                {order.shippingAddress.fullName && (
                  <p className="mb-1">
                    <strong>Name:</strong> {order.shippingAddress.fullName}
                  </p>
                )}
                {order.shippingAddress.phone && (
                  <p className="mb-1">
                    <strong>Phone:</strong> {order.shippingAddress.phone}
                  </p>
                )}
                <p className="mb-1">
                  <strong>Address:</strong>
                </p>
                <p className="mb-1">{order.shippingAddress.street}</p>
                <p className="mb-1">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </p>
                <p className="mb-0">{order.shippingAddress.country}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Order Cancellation</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel this order?</p>
                <p className="text-muted mb-0">
                  <strong>Order #:</strong> {order?.orderNumber || order?._id.slice(-8)}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelLoading}
                >
                  No, Keep Order
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancelOrder}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
