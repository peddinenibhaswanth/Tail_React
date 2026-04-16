const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { isAuthenticated, isSellerOrAdmin } = require("../middleware/auth");
const { uploadProductImages } = require("../middleware/upload");
const {
  validateProduct,
  validateProductUpdate,
  validateStockUpdate,
  validateReview,
} = require("../middleware/validators");

// Public routes
router.get("/", productController.getAllProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/sale", productController.getOnSaleProducts);
router.get("/categories", productController.getCategories);
router.get("/seller/:sellerId", productController.getProductsBySeller);
router.get("/:id", productController.getProductById);

// Protected routes (seller/admin only) with validation
router.post(
  "/",
  isAuthenticated,
  isSellerOrAdmin,
  uploadProductImages,
  validateProduct,
  productController.createProduct
);
router.put(
  "/:id",
  isAuthenticated,
  isSellerOrAdmin,
  uploadProductImages,
  validateProductUpdate,
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
  validateStockUpdate,
  productController.updateStock
);

module.exports = router;
