import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for session-based authentication
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (backend down)
    if (!error.response) {
      console.error("CRITICAL: Backend connection failed!");
      // You could also dispatch a global error action here if you had access to the store
      return Promise.reject({
        message: "Server is currently unreachable. Please ensure the backend is running.",
        isNetworkError: true,
        status: 0,
        data: null
      });
    }

    const { status, data, config } = error.response;

    // Handle 401 Unauthorized
    if (status === 401) {
      // Don't redirect for auth check endpoints - just let them fail silently
      const isAuthCheck = config.url?.includes("/api/auth/current");

      if (!isAuthCheck) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Only redirect if not already on login/register pages
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          window.location.href = "/login";
        }
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.error("Access denied - Insufficient permissions");
    }

    // Handle 404 Not Found
    if (status === 404) {
      console.error("Resource not found");
    }

    // Handle 500 Server Error
    if (status >= 500) {
      console.error("Server error - Please try again later");
    }

    // Return standardized error
    return Promise.reject({
      message: data?.message || error.message || "An error occurred",
      status,
      data,
    });
  }
);

export default axiosInstance;
