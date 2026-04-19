import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  calculateTotal,
  updateQuantityOptimistic,
  removeItemOptimistic,
} from "../../redux/slices/cartSlice";
import { resolveImageUrl } from "../../utils/imageUrl";

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, total, itemCount, isLoading } = useSelector(
    (state) => state.cart
  );

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  useEffect(() => {
    dispatch(calculateTotal());
  }, [dispatch, items]);

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity < 1) return;
    // Optimistic update - instant UI feedback
    dispatch(updateQuantityOptimistic({ productId, quantity }));
    // Then sync with backend - revert optimistic update on failure
    const result = await dispatch(updateCartItem({ itemId: productId, quantity }));
    if (updateCartItem.rejected.match(result)) {
      // Backend rejected (e.g. stock exceeded) — refetch real cart state
      dispatch(getCart());
    }
  };

  const handleRemove = (productId) => {
    // Optimistic update - instant UI feedback
    dispatch(removeItemOptimistic(productId));
    // Then sync with backend
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const hasStockIssue = items.some(
    (item) => item.product && item.quantity > item.product.stock
  );

  const handleCheckout = () => {
    if (hasStockIssue) return;
    navigate("/checkout");
  };

  const getProductImage = (product) => {
    const image = product.mainImage || product.image;
    if (!image) return "/placeholder-product.png";
    return resolveImageUrl(image, "products");
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="container py-5">
        <div className="empty-state text-center">
          <div className="mb-3" style={{ fontSize: '3rem' }}>🛒</div>
          <h3 className="fw-bold mb-3">Your cart is empty</h3>
          <p className="text-muted mb-4">
            Browse our pets and products to add items to your cart.
          </p>
          <Link to="/products" className="btn btn-primary rounded-pill px-4 me-2">
            <i className="bi bi-bag me-1"></i>Shop Products
          </Link>
          <Link to="/pets" className="btn btn-outline-primary rounded-pill px-4">
            <i className="bi bi-heart me-1"></i>View Pets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1"><i className="bi bi-cart3 me-2 text-primary"></i>Shopping Cart</h2>
        <p className="text-muted mb-0 small">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
      </div>
      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              {items.map((item) => (
                <div
                  className="d-flex align-items-center border-bottom py-3"
                  key={item._id}
                >
                  <img
                    src={getProductImage(item.product)}
                    alt={item.product.name}
                    className="me-3 rounded"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = "/placeholder-product.png";
                    }}
                  />
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{item.product.name}</h5>
                    <p className="mb-1 text-muted">
                      ₹{item.product.price.toFixed(2)} each
                    </p>
                    {item.quantity > item.product.stock && (
                      <p className="mb-1 text-danger small fw-semibold">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Only {item.product.stock} left in stock
                      </p>
                    )}
                    {item.product.stock === 0 && (
                      <p className="mb-1 text-danger small fw-semibold">
                        <i className="bi bi-x-circle me-1"></i>Out of stock
                      </p>
                    )}
                    <div className="d-flex align-items-center">
                      <div
                        className="input-group input-group-sm"
                        style={{ maxWidth: 140 }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            handleQuantityChange(
                              item.product._id,
                              item.quantity - 1
                            )
                          }
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={item.quantity}
                          min="1"
                          max={item.product.stock}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            handleQuantityChange(
                              item.product._id,
                              Math.min(val, item.product.stock)
                            );
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={item.quantity >= item.product.stock}
                          onClick={() =>
                            handleQuantityChange(
                              item.product._id,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-link text-danger ms-3 p-0"
                        onClick={() => handleRemove(item.product._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-end" style={{ minWidth: 100 }}>
                    <div className="fw-semibold">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill px-3"
            onClick={handleClearCart}
          >
            <i className="bi bi-trash me-1"></i>Clear Cart
          </button>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-3"><i className="bi bi-receipt me-2 text-primary"></i>Order Summary</h5>
              <p className="mb-1">Items: {itemCount}</p>
              <p className="mb-3">Subtotal: ₹{total.toFixed(2)}</p>
              {hasStockIssue && (
                <div className="alert alert-danger py-2 small mb-2" role="alert">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Some items exceed available stock. Please update quantities.
                </div>
              )}
              <button
                type="button"
                className="btn btn-primary w-100 mb-2 rounded-pill fw-semibold py-2"
                onClick={handleCheckout}
                disabled={hasStockIssue}
              >
                <i className="bi bi-lock me-1"></i>Proceed to Checkout
              </button>
              <Link to="/products" className="btn btn-link w-100">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
