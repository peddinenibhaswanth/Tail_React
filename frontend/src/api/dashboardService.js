import axios from "./axios";

// Get admin dashboard data
export const getAdminDashboard = async (period = "30") => {
  const response = await axios.get("/api/dashboard/admin", {
    params: { period },
  });
  return response.data;
};

// Get seller dashboard data
export const getSellerDashboard = async (period = "30") => {
  const response = await axios.get("/api/dashboard/seller", {
    params: { period },
  });
  return response.data;
};

// Get veterinary dashboard data
export const getVeterinaryDashboard = async (period = "30") => {
  const response = await axios.get("/api/dashboard/veterinary", {
    params: { period },
  });
  return response.data;
};

// Get customer dashboard data
export const getCustomerDashboard = async () => {
  const response = await axios.get("/api/dashboard/customer");
  return response.data;
};
