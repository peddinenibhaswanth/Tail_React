const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { isAuthenticated } = require("../middleware/auth");
const { validateAddToCart, validateCartUpdate } = require("../middleware/validators");

// All cart routes require authentication
router.get("/", isAuthenticated, cartController.getCart);
router.get("/count", isAuthenticated, cartController.getCartCount);
router.get("/validate", isAuthenticated, cartController.validateCart);
router.post("/items", isAuthenticated, validateAddToCart, cartController.addToCart);
router.put("/items/:productId", isAuthenticated, validateCartUpdate, cartController.updateCartItem);
router.delete(
  "/items/:productId",
  isAuthenticated,
  cartController.removeFromCart
);
router.delete("/", isAuthenticated, cartController.clearCart);

module.exports = router;
