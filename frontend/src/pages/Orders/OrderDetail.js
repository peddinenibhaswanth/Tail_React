import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../../redux/slices/orderSlice";

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order, isLoading, isError, message } = useSelector(
    (state) => state.orders
  );

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
        <Link to="/orders" className="btn btn-outline-secondary btn-sm">
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
                    <div className="fw-semibold">{item.product?.name}</div>
                    <small className="text-muted">
                      Qty: {item.quantity} × ₹{item.product?.price?.toFixed(2)}
                    </small>
                  </div>
                  <div>
                    ₹{(item.quantity * (item.product?.price || 0)).toFixed(2)}
                  </div>
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
                <strong>Order ID:</strong> {order._id}
              </p>
              <p className="mb-1">
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <p className="mb-1">
                <strong>Status:</strong>{" "}
                <span className="badge bg-secondary text-uppercase">
                  {order.status}
                </span>
              </p>
              <hr />
              <p className="mb-1">
                <strong>Total Amount:</strong> ₹{order.totalAmount?.toFixed(2)}
              </p>
            </div>
          </div>

          {order.shippingInfo && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Shipping Information</h5>
                <p className="mb-1">
                  <strong>{order.shippingInfo.fullName}</strong>
                </p>
                <p className="mb-1">{order.shippingInfo.address}</p>
                <p className="mb-1">
                  {order.shippingInfo.city}, {order.shippingInfo.state}{" "}
                  {order.shippingInfo.postalCode}
                </p>
                {order.shippingInfo.phone && (
                  <p className="mb-0">
                    <strong>Phone:</strong> {order.shippingInfo.phone}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
