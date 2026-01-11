const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import configurations
const connectDB = require("./config/db");

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// ===========================================
// SECURITY MIDDLEWARE - Helmet
// ===========================================
// Helmet sets various HTTP headers for security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be served cross-origin
    contentSecurityPolicy: false, // Disable CSP for development (enable in production)
  })
);

// ===========================================
// COMPRESSION MIDDLEWARE
// ===========================================
// Compresses response bodies for faster transfer
app.use(
  compression({
    level: 6, // Compression level (1-9, 6 is default)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't accept it
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// ===========================================
// RATE LIMITING MIDDLEWARE
// ===========================================
// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Stricter rate limiter for authentication routes - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===========================================
// CORS MIDDLEWARE
// ===========================================
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
    ],
    credentials: true,
  })
);

// ===========================================
// BODY PARSING MIDDLEWARE
// ===========================================
app.use(express.json({ limit: "10mb" })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// NOTE: With JWT authentication, we don't need express-session or passport session middleware
// JWT is stateless - each request carries the token in the Authorization header
// The token is verified in the auth middleware (backend/middleware/auth.js)

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===========================================
// APPLY RATE LIMITERS TO ROUTES
// ===========================================
// Apply stricter rate limiting to auth routes (login/register)
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Apply general rate limiting to all API routes
app.use("/api", apiLimiter);

// ===========================================
// ROUTES
// ===========================================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pets", require("./routes/petRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/revenue", require("./routes/revenueRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api", require("./routes/indexRoutes"));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
