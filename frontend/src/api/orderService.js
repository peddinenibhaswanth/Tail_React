import axios from "./axios";

// Create order
export const createOrder = async (orderData) => {
  const response = await axios.post("/api/orders", orderData);
  return response.data;
};

// Get user orders
export const getUserOrders = async () => {
  const response = await axios.get("/api/orders/my-orders");
  return response.data;
};

// Get single order
export const getOrder = async (id) => {
  const response = await axios.get(`/api/orders/${id}`);
  return response.data;
};

// Cancel order
export const cancelOrder = async (id) => {
  const response = await axios.patch(`/api/orders/${id}/cancel`);
  return response.data;
};

// Update order status (seller/admin)
export const updateOrderStatus = async (id, status) => {
  const response = await axios.patch(`/api/orders/${id}/status`, { status });
  return response.data;
};

// Get seller orders
export const getSellerOrders = async () => {
  const response = await axios.get("/api/orders/seller/my-orders");
  return response.data;
};

// Get all orders (admin)
export const getAllOrders = async (params = {}) => {
  const response = await axios.get("/api/orders/admin/all", { params });
  return response.data;
};

// Get order stats
export const getOrderStats = async () => {
  const response = await axios.get("/api/orders/admin/stats");
  return response.data;
};
