const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { isAuthenticated } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Checkout process
 */

/**
 * @swagger
 * /api/checkout/summary:
 *   get:
 *     summary: Get checkout summary
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout summary
 *       404:
 *         description: Cart not found
 */
router.get("/summary", isAuthenticated, checkoutController.getCheckoutSummary);

/**
 * @swagger
 * /api/checkout/validate:
 *   post:
 *     summary: Validate checkout
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout validated
 *       400:
 *         description: Bad request
 */
router.post("/validate", isAuthenticated, checkoutController.validateCheckout);

/**
 * @swagger
 * /api/checkout/shipping-cost:
 *   post:
 *     summary: Calculate shipping cost
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: object
 *     responses:
 *       200:
 *         description: Shipping cost calculated
 *       400:
 *         description: Bad request
 */
router.post(
  "/shipping-cost",
  isAuthenticated,
  checkoutController.calculateShippingCost
);

/**
 * @swagger
 * /api/checkout/promo:
 *   post:
 *     summary: Apply promo code
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               promoCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Promo code applied
 *       400:
 *         description: Bad request
 */
router.post("/promo", isAuthenticated, checkoutController.applyPromoCode);

module.exports = router;
