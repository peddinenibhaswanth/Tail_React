import axios from "./axios";

// Get cart
export const getCart = async () => {
  const response = await axios.get("/api/cart");
  return response.data;
};

// Add to cart
export const addToCart = async (cartData) => {
  // Backend expects productId, not product
  const data = {
    productId: cartData.productId || cartData.product,
    quantity: cartData.quantity || 1,
  };
  const response = await axios.post("/api/cart/items", data);
  return response.data;
};

// Update cart item
export const updateCartItem = async (productId, quantity) => {
  const response = await axios.put(`/api/cart/items/${productId}`, {
    quantity,
  });
  return response.data;
};

// Remove from cart
export const removeFromCart = async (productId) => {
  const response = await axios.delete(`/api/cart/items/${productId}`);
  return response.data;
};

// Clear cart
export const clearCart = async () => {
  const response = await axios.delete("/api/cart");
  return response.data;
};

// Get cart count
export const getCartCount = async () => {
  const response = await axios.get("/api/cart/count");
  return response.data;
};

// Validate cart (check stock availability)
export const validateCart = async () => {
  const response = await axios.get("/api/cart/validate");
  return response.data;
};
