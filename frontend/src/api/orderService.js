import axios from "./axios";

// Create order
export const createOrder = async (orderData) => {
  const response = await axios.post("/api/orders", orderData);
  return response.data;
};

// Get user orders
export const getUserOrders = async () => {
  const response = await axios.get("/api/orders/my");
  return response.data;
};

// Get single order
export const getOrder = async (id) => {
  const response = await axios.get(`/api/orders/${id}`);
  return response.data;
};

// Cancel order
export const cancelOrder = async (id) => {
  const response = await axios.put(`/api/orders/${id}/cancel`);
  return response.data;
};
