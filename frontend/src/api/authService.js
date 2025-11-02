import axios from "./axios";

// Register user
export const register = async (userData) => {
  const response = await axios.post("/api/auth/register", userData);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

// Login user
export const login = async (userData) => {
  const response = await axios.post("/api/auth/login", userData);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

// Logout user
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Get current user profile
export const getProfile = async () => {
  const response = await axios.get("/api/auth/profile");
  return response.data;
};

// Update user profile
export const updateProfile = async (userData) => {
  const response = await axios.put("/api/auth/profile", userData);
  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

// Upload profile image
export const uploadProfileImage = async (formData) => {
  const response = await axios.post("/api/auth/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
