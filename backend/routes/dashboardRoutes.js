const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const {
  isAuthenticated,
  isAdminOrCoAdmin,
  isSellerOrAdmin,
  isVeterinary,
} = require("../middleware/auth");

// Role-specific dashboard routes
router.get(
  "/admin",
  isAuthenticated,
  isAdminOrCoAdmin,
  dashboardController.getAdminDashboard
);
router.get(
  "/seller",
  isAuthenticated,
  isSellerOrAdmin,
  dashboardController.getSellerDashboard
);
router.get(
  "/veterinary",
  isAuthenticated,
  isVeterinary,
  dashboardController.getVeterinaryDashboard
);
router.get(
  "/customer",
  isAuthenticated,
  dashboardController.getCustomerDashboard
);

module.exports = router;
