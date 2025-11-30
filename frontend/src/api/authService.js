import axios from "./axios";

// Register user
export const register = async (userData) => {
  // Prepare data with password2 for backend validation
  const registerData = {
    ...userData,
    password2: userData.password, // Backend expects password2 for confirmation
  };
  const response = await axios.post("/api/auth/register", registerData);
  if (response.data.success && response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

// Login user
export const login = async (userData) => {
  const response = await axios.post("/api/auth/login", userData);
  if (response.data.success && response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

// Logout user
export const logout = async () => {
  try {
    await axios.post("/api/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  }
  localStorage.removeItem("user");
};

// Get current user (check session)
export const getCurrentUser = async () => {
  const response = await axios.get("/api/auth/current");
  return response.data;
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

// Change password
export const changePassword = async (passwordData) => {
  const response = await axios.put("/api/auth/change-password", passwordData);
  return response.data;
};
