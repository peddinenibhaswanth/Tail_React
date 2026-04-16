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

// Get featured products
export const getFeaturedProducts = async () => {
  const response = await axios.get("/api/products/featured");
  return response.data;
};

// Get on sale products
export const getOnSaleProducts = async () => {
  const response = await axios.get("/api/products/sale");
  return response.data;
};

// Get product categories
export const getCategories = async () => {
  const response = await axios.get("/api/products/categories");
  return response.data;
};

// Get products by seller
export const getProductsBySeller = async (sellerId) => {
  const response = await axios.get(`/api/products/seller/${sellerId}`);
  return response.data;
};

// Create product (Seller/Admin)
export const createProduct = async (productData) => {
  const response = await axios.post("/api/products", productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Update product (Seller/Admin)
export const updateProduct = async (id, productData) => {
  const response = await axios.put(`/api/products/${id}`, productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Delete product (Seller/Admin)
export const deleteProduct = async (id) => {
  const response = await axios.delete(`/api/products/${id}`);
  return response.data;
};

// Update product stock (Seller/Admin)
export const updateStock = async (id, stock) => {
  const response = await axios.patch(`/api/products/${id}/stock`, { stock });
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
