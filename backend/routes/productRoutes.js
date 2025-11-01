const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { isAuthenticated, isSellerOrAdmin } = require("../middleware/auth");
const { productUpload } = require("../middleware/upload");

// Public routes
router.get("/", productController.getAllProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/sale", productController.getOnSaleProducts);
router.get("/categories", productController.getCategories);
router.get("/seller/:sellerId", productController.getProductsBySeller);
router.get("/:id", productController.getProductById);

// Protected routes (seller/admin only)
router.post(
  "/",
  isAuthenticated,
  isSellerOrAdmin,
  productUpload,
  productController.createProduct
);
router.put(
  "/:id",
  isAuthenticated,
  isSellerOrAdmin,
  productUpload,
  productController.updateProduct
);
router.delete(
  "/:id",
  isAuthenticated,
  isSellerOrAdmin,
  productController.deleteProduct
);
router.patch(
  "/:id/stock",
  isAuthenticated,
  isSellerOrAdmin,
  productController.updateStock
);

module.exports = router;
