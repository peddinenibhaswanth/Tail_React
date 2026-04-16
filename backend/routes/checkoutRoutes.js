const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { isAuthenticated } = require("../middleware/auth");

// All checkout routes require authentication
router.get("/summary", isAuthenticated, checkoutController.getCheckoutSummary);
router.post("/validate", isAuthenticated, checkoutController.validateCheckout);
router.post(
  "/shipping-cost",
  isAuthenticated,
  checkoutController.calculateShippingCost
);
router.post("/promo", isAuthenticated, checkoutController.applyPromoCode);

module.exports = router;
