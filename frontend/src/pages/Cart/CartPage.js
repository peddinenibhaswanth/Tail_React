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

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    // Optimistic update - instant UI feedback
    dispatch(updateQuantityOptimistic({ productId, quantity }));
    // Then sync with backend
    dispatch(updateCartItem({ itemId: productId, quantity }));
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

  const handleCheckout = () => {
    navigate("/checkout");
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
        <div className="text-center">
          <h3 className="mb-3">Your cart is empty</h3>
          <p className="text-muted mb-4">
            Browse our pets and products to add items to your cart.
          </p>
          <Link to="/products" className="btn btn-primary me-2">
            Shop Products
          </Link>
          <Link to="/pets" className="btn btn-outline-primary">
            View Pets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Shopping Cart</h2>
      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-body">
              {items.map((item) => (
                <div
                  className="d-flex align-items-center border-bottom py-3"
                  key={item._id}
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="me-3 rounded"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{item.product.name}</h5>
                    <p className="mb-1 text-muted">
                      ₹{item.product.price.toFixed(2)} each
                    </p>
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
                          onChange={(e) =>
                            handleQuantityChange(
                              item.product._id,
                              Number(e.target.value) || 1
                            )
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
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
            className="btn btn-outline-danger"
            onClick={handleClearCart}
          >
            Clear Cart
          </button>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Order Summary</h5>
              <p className="mb-1">Items: {itemCount}</p>
              <p className="mb-3">Subtotal: ₹{total.toFixed(2)}</p>
              <button
                type="button"
                className="btn btn-primary w-100 mb-2"
                onClick={handleCheckout}
              >
                Proceed to Checkout
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
