const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {
  isAuthenticated,
  isSellerOrAdmin,
  isAdminOrCoAdmin,
} = require("../middleware/auth");

// Customer routes (require authentication)
router.post("/", isAuthenticated, orderController.createOrder);
router.get("/my-orders", isAuthenticated, orderController.getMyOrders);
router.get("/:id", isAuthenticated, orderController.getOrderById);
router.patch("/:id/cancel", isAuthenticated, orderController.cancelOrder);

// Seller routes
router.get(
  "/seller/my-orders",
  isAuthenticated,
  isSellerOrAdmin,
  orderController.getSellerOrders
);
router.patch(
  "/:id/status",
  isAuthenticated,
  isSellerOrAdmin,
  orderController.updateOrderStatus
);

// Admin routes
router.get(
  "/admin/all",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.getAllOrders
);
router.get(
  "/admin/stats",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.getOrderStats
);
router.patch(
  "/:id/payment",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.updatePaymentStatus
);

module.exports = router;
