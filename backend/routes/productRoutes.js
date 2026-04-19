const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { isAuthenticated, isSellerOrAdmin } = require("../middleware/auth");
const { uploadProductImages } = require("../middleware/upload");
const { cacheResponse } = require("../middleware/cache");
const { uploadRequestFilesToCloudinary } = require("../middleware/cloudinaryUpload");
const {
  validateProduct,
  validateProductUpdate,
  validateStockUpdate,
  validateReview,
} = require("../middleware/validators");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management and browsing
 */

// Public routes
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve a list of products with filtering, sorting, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter for products that are in stock
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get(
  "/",
  cacheResponse({ namespace: "products", ttlSeconds: 180 }),
  productController.getAllProducts
);

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get a list of featured products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of featured products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get(
  "/featured",
  cacheResponse({ namespace: "products", ttlSeconds: 300 }),
  productController.getFeaturedProducts
);

/**
 * @swagger
 * /api/products/sale:
 *   get:
 *     summary: Get a list of products on sale
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of products on sale
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get(
  "/sale",
  cacheResponse({ namespace: "products", ttlSeconds: 300 }),
  productController.getOnSaleProducts
);

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Get a list of all product categories
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of category strings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get(
  "/categories",
  cacheResponse({ namespace: "products", ttlSeconds: 600 }),
  productController.getCategories
);

/**
 * @swagger
 * /api/products/seller/{sellerId}:
 *   get:
 *     summary: Get all products by a specific seller
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller
 *     responses:
 *       200:
 *         description: A list of products by the seller
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get(
  "/seller/:sellerId",
  cacheResponse({ namespace: "products", ttlSeconds: 180 }),
  productController.getProductsBySeller
);

// Review eligibility check (must be before /:id to avoid conflict)
/**
 * @swagger
 * /api/products/reviews/check-eligibility:
 *   get:
 *     summary: Check which delivered products the user is eligible to review
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of products eligible for review
 */
router.get("/reviews/check-eligibility", isAuthenticated, productController.checkReviewEligibility);

// Get all reviews for the authenticated seller's products
/**
 * @swagger
 * /api/products/reviews/seller-reviews:
 *   get:
 *     summary: Get all reviews for the authenticated seller's products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of reviews for the seller's products
 */
router.get("/reviews/seller-reviews", isAuthenticated, isSellerOrAdmin, productController.getSellerReviews);

// Admin: get all reviews across all products
/**
 * @swagger
 * /api/products/reviews/admin-all:
 *   get:
 *     summary: (Admin) Get all reviews across all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all reviews
 */
router.get("/reviews/admin-all", isAuthenticated, productController.getAllReviewsAdmin);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     responses:
 *       200:
 *         description: A single product object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get(
  "/:id",
  cacheResponse({ namespace: "products", ttlSeconds: 300 }),
  productController.getProductById
);

// Review routes
/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Get reviews for a specific product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     responses:
 *       200:
 *         description: A list of reviews for the product
 *   post:
 *     summary: Create a new review for a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.get(
  "/:id/reviews",
  cacheResponse({ namespace: "products", ttlSeconds: 180 }),
  productController.getProductReviews
);
router.post("/:id/reviews", isAuthenticated, validateReview, productController.createReview);

/**
 * @swagger
 * /api/products/{id}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete("/:id/reviews/:reviewId", isAuthenticated, productController.deleteReview);

/**
 * @swagger
 * /api/products/{id}/reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark a review as helpful
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review
 *     responses:
 *       200:
 *         description: Review marked as helpful
 */
router.post("/:id/reviews/:reviewId/helpful", isAuthenticated, productController.voteHelpful);

// Protected routes (seller/admin only) with validation
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               petType:
 *                 type: string
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  "/",
  isAuthenticated,
  isSellerOrAdmin,
  uploadProductImages,
  uploadRequestFilesToCloudinary({ folder: "products" }),
  validateProduct,
  productController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to update
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.put(
  "/:id",
  isAuthenticated,
  isSellerOrAdmin,
  uploadProductImages,
  uploadRequestFilesToCloudinary({ folder: "products" }),
  validateProductUpdate,
  productController.updateProduct
);
router.delete(
  "/:id",
  isAuthenticated,
  isSellerOrAdmin,
  productController.deleteProduct
);

/**
 * @swagger
 * /api/products/{id}/images:
 *   post:
 *     summary: Add images to an existing product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images added successfully
 */
router.post(
  "/:id/images",
  isAuthenticated,
  isSellerOrAdmin,
  uploadProductImages,
  uploadRequestFilesToCloudinary({ folder: "products" }),
  productController.addImages
);

/**
 * @swagger
 * /api/products/{id}/images/{imageIndex}:
 *   delete:
 *     summary: Delete a specific image from a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *       - in: path
 *         name: imageIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: The index of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
router.delete(
  "/:id/images/:imageIndex",
  isAuthenticated,
  isSellerOrAdmin,
  productController.deleteImage
);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Update the stock of a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock:
 *                 type: integer
 *                 description: The new stock quantity
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */
router.patch(
  "/:id/stock",
  isAuthenticated,
  isSellerOrAdmin,
  validateStockUpdate,
  productController.updateStock
);

module.exports = router;
