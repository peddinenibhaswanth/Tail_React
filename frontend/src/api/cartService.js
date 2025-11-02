import axios from "./axios";

// Get cart
export const getCart = async () => {
  const response = await axios.get("/api/cart");
  return response.data;
};

// Add to cart
export const addToCart = async (cartData) => {
  const response = await axios.post("/api/cart/add", cartData);
  return response.data;
};

// Update cart item
export const updateCartItem = async (itemId, quantity) => {
  const response = await axios.put(`/api/cart/update/${itemId}`, { quantity });
  return response.data;
};

// Remove from cart
export const removeFromCart = async (itemId) => {
  const response = await axios.delete(`/api/cart/remove/${itemId}`);
  return response.data;
};

// Clear cart
export const clearCart = async () => {
  const response = await axios.delete("/api/cart/clear");
  return response.data;
};
