const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenueController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Revenue
 *   description: Revenue, ledger, and payouts
 */

router.use(isAuthenticated);

/**
 * @swagger
 * /api/revenue/ledger:
 *   get:
 *     summary: Get financial ledger (Admin sees all; Seller/Vet sees own)
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, refund, payout, commission_fee, tax_payment]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Ledger fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *       403:
 *         description: Not authorized
 */
router.get("/ledger", revenueController.getLedger);

/**
 * @swagger
 * /api/revenue/summary:
 *   get:
 *     summary: Get platform financial summary (Admin only)
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Summary fetched
 *       403:
 *         description: Admin privileges required
 */
router.get("/summary", isAdmin, revenueController.getRevenueSummary);

/**
 * @swagger
 * /api/revenue/payout:
 *   post:
 *     summary: Process a payout (Admin only)
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount]
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *               referenceId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payout processed
 *       400:
 *         description: Invalid payout details
 *       403:
 *         description: Admin privileges required
 *       404:
 *         description: User not found
 */
router.post("/payout", isAdmin, revenueController.processPayout);

module.exports = router;
