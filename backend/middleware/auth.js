const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT Secret (same as in authController)
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-in-production";

// Main JWT authentication middleware
// This extracts the token from Authorization header, verifies it, and attaches user to req
const ensureAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in to access this resource",
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please log in to access this resource",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user by ID from token and attach to request
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Please log in to access this resource",
    });
  }
};

const ensureGuest = (req, res, next) => {
  // Check if token exists in header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return res.status(400).json({
      success: false,
      message: "You are already logged in",
    });
  }
  return next();
};

// All role-based middleware now uses req.user set by ensureAuthenticated
const isAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "co-admin")
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
};

const isStrictlyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Primary admin privileges required.",
  });
};

const isSeller = (req, res, next) => {
  if (
    req.user &&
    req.user.role === "seller" &&
    req.user.isApproved
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Approved seller account required.",
  });
};

const isSellerOrAdmin = (req, res, next) => {
  if (
    req.user &&
    ((req.user.role === "seller" && req.user.isApproved) ||
      req.user.role === "admin" ||
      req.user.role === "co-admin")
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Seller or admin privileges required.",
  });
};

const isVeterinary = (req, res, next) => {
  if (
    req.user &&
    req.user.role === "veterinary" &&
    req.user.isApproved
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Approved veterinary account required.",
  });
};

const isVet = isVeterinary;

const isCustomer = (req, res, next) => {
  if (req.user && req.user.role === "customer") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Customer account required.",
  });
};

const isAdminCoAdminOrSeller = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" ||
      req.user.role === "co-admin" ||
      (req.user.role === "seller" && req.user.isApproved))
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin or seller privileges required.",
  });
};

const isApproved = (req, res, next) => {
  if (req.user && req.user.isApproved) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Your account is pending approval.",
  });
};

// Aliases for backward compatibility
const isAuthenticated = ensureAuthenticated;
const isAdminOrCoAdmin = isAdmin;

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  isAdmin,
  isStrictlyAdmin,
  isSeller,
  isSellerOrAdmin,
  isVeterinary,
  isVet,
  isCustomer,
  isAdminCoAdminOrSeller,
  isApproved,
  isAuthenticated,
  isAdminOrCoAdmin,
};
