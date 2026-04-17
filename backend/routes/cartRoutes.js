const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { isAuthenticated } = require("../middleware/auth");
const { validateAddToCart, validateCartUpdate } = require("../middleware/validators");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the current user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's shopping cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *   delete:
 *     summary: Clear all items from the user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.get("/", isAuthenticated, cartController.getCart);
router.delete("/", isAuthenticated, cartController.clearCart);

/**
 * @swagger
 * /api/cart/count:
 *   get:
 *     summary: Get the total number of items in the user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The total item count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get("/count", isAuthenticated, cartController.getCartCount);

/**
 * @swagger
 * /api/cart/validate:
 *   get:
 *     summary: Validate the items in the cart for stock and price changes
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Validation results
 */
router.get("/validate", isAuthenticated, cartController.validateCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add an item to the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 */
router.post("/items", isAuthenticated, validateAddToCart, cartController.addToCart);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   put:
 *     summary: Update the quantity of an item in the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *   delete:
 *     summary: Remove an item from the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to remove
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 */
router.put("/items/:productId", isAuthenticated, validateCartUpdate, cartController.updateCartItem);
router.delete(
  "/items/:productId",
  isAuthenticated,
  cartController.removeFromCart
);

module.exports = router;
