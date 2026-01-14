const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {
  isAuthenticated,
  isSellerOrAdmin,
  isAdminOrCoAdmin,
} = require("../middleware/auth");
const { validateOrderStatus } = require("../middleware/validators");

// Seller routes (must come before /:id to prevent route conflicts)
router.get(
  "/seller/my-orders",
  isAuthenticated,
  isSellerOrAdmin,
  orderController.getSellerOrders
);

// Admin routes (must come before /:id)
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

// Customer routes (require authentication)
router.post("/", isAuthenticated, orderController.createOrder);
router.get("/my-orders", isAuthenticated, orderController.getMyOrders);

// Specific order routes (must come after all named routes)
router.get("/:id", isAuthenticated, orderController.getOrderById);
router.patch("/:id/cancel", isAuthenticated, orderController.cancelOrder);
router.patch(
  "/:id/status",
  isAuthenticated,
  isSellerOrAdmin,
  validateOrderStatus,
  orderController.updateOrderStatus
);
router.patch(
  "/:id/payment",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.updatePaymentStatus
);

module.exports = router;
