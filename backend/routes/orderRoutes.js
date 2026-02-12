const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {
  isAuthenticated,
  isSellerOrAdmin,
  isAdminOrCoAdmin,
} = require("../middleware/auth");
const { validateOrderStatus } = require("../middleware/validators");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders/seller/my-orders:
 *   get:
 *     summary: Get all orders for the authenticated seller
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of orders for the seller
 */
router.get(
  "/seller/my-orders",
  isAuthenticated,
  isSellerOrAdmin,
  orderController.getSellerOrders
);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: (Admin) Get all orders across the system
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all orders
 */
router.get(
  "/admin/all",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.getAllOrders
);

/**
 * @swagger
 * /api/orders/admin/stats:
 *   get:
 *     summary: (Admin) Get order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics
 */
router.get(
  "/admin/stats",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.getOrderStats
);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order from the user's cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post("/", isAuthenticated, orderController.createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get("/my-orders", isAuthenticated, orderController.getMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *     responses:
 *       200:
 *         description: A single order object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get("/:id", isAuthenticated, orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to cancel
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.patch("/:id/cancel", isAuthenticated, orderController.cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/restore-stock:
 *   post:
 *     summary: (Admin) Restore stock for a cancelled or returned order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *     responses:
 *       200:
 *         description: Stock restored successfully
 */
router.post(
  "/:id/restore-stock",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.restoreStock
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: (Seller/Admin) Update the status of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled, returned]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch(
  "/:id/status",
  isAuthenticated,
  isSellerOrAdmin,
  validateOrderStatus,
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   patch:
 *     summary: (Admin) Update the payment status of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPaid:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 */
router.patch(
  "/:id/payment",
  isAuthenticated,
  isAdminOrCoAdmin,
  orderController.updatePaymentStatus
);

module.exports = router;
