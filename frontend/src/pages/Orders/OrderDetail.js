import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOrder, cancelOrder } from "../../redux/slices/orderSlice";
import useAuth from "../../hooks/useAuth";

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { order, isLoading, isError, message, isSuccess } = useSelector(
    (state) => state.orders
  );
  const { isAdmin, isSeller, user } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
        <h2>Order Details</h2>
        <Link to={getBackToOrdersLink()} className="btn btn-outline-secondary btn-sm">
          Back to Orders
        </Link>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Items</h5>
              {order.items?.map((item) => (
                <div
                  key={item._id}
                  className="d-flex justify-content-between border-bottom py-2"
                >
                  <div>
                    <div className="fw-semibold">
                      {item.name || item.product?.name}
                    </div>
                    <small className="text-muted">
                      Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}
                    </small>
                  </div>
                  <div>₹{(item.quantity * (item.price || 0)).toFixed(2)}</div>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <p className="text-muted mb-0">
                  No items found for this order.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Summary</h5>
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
                  className={`badge text-uppercase bg-${getStatusBadge(
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
                    className="btn btn-danger btn-sm w-100"
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
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Shipping Information</h5>
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
