const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const {
  isAuthenticated,
  isAdminOrCoAdmin,
  isSellerOrAdmin,
  isVeterinary,
} = require("../middleware/auth");
const { cacheResponse } = require("../middleware/cache");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-based dashboard data
 */

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get data for the admin dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 */
router.get(
  "/admin",
  isAuthenticated,
  isAdminOrCoAdmin,
  cacheResponse({ namespace: "dashboard", ttlSeconds: 120, varyByUser: true }),
  dashboardController.getAdminDashboard
);

/**
 * @swagger
 * /api/dashboard/seller:
 *   get:
 *     summary: Get data for the seller dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller dashboard data
 */
router.get(
  "/seller",
  isAuthenticated,
  isSellerOrAdmin,
  cacheResponse({ namespace: "dashboard", ttlSeconds: 120, varyByUser: true }),
  dashboardController.getSellerDashboard
);

/**
 * @swagger
 * /api/dashboard/veterinary:
 *   get:
 *     summary: Get data for the veterinary dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Veterinary dashboard data
 */
router.get(
  "/veterinary",
  isAuthenticated,
  isVeterinary,
  cacheResponse({ namespace: "dashboard", ttlSeconds: 120, varyByUser: true }),
  dashboardController.getVeterinaryDashboard
);

/**
 * @swagger
 * /api/dashboard/customer:
 *   get:
 *     summary: Get data for the customer dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer dashboard data
 */
router.get(
  "/customer",
  isAuthenticated,
  cacheResponse({ namespace: "dashboard", ttlSeconds: 120, varyByUser: true }),
  dashboardController.getCustomerDashboard
);

module.exports = router;
