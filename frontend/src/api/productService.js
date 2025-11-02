import axios from "./axios";

// Get all products
export const getProducts = async (query) => {
  const response = await axios.get("/api/products", { params: query });
  return response.data;
};

// Get single product
export const getProduct = async (id) => {
  const response = await axios.get(`/api/products/${id}`);
  return response.data;
};

// Add product review
export const addReview = async (productId, reviewData) => {
  const response = await axios.post(
    `/api/products/${productId}/reviews`,
    reviewData
  );
  return response.data;
};

// Get product reviews
export const getReviews = async (productId) => {
  const response = await axios.get(`/api/products/${productId}/reviews`);
  return response.data;
};
