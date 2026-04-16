const express = require("express");
const router = express.Router();

// Import all route modules
const authRoutes = require("./authRoutes");
const petRoutes = require("./petRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const checkoutRoutes = require("./checkoutRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const adminRoutes = require("./adminRoutes");
const messageRoutes = require("./messageRoutes");

// Health check route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Pet Adoption Platform API is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount all routes
router.use("/auth", authRoutes);
router.use("/pets", petRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/messages", messageRoutes);

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

module.exports = router;
