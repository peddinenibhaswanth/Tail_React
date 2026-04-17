const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const petController = require("../controllers/petController");
const { requirePartnerApiKey } = require("../middleware/partnerAuth");
const { cacheResponse } = require("../middleware/cache");

/**
 * @swagger
 * tags:
 *   name: Partner
 *   description: B2B partner APIs (API key protected)
 */

/**
 * @swagger
 * /api/partner/products:
 *   get:
 *     summary: Partner - list products (read-only)
 *     tags: [Partner]
 *     security:
 *       - partnerApiKey: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: petType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product list
 */
router.get(
  "/products",
  requirePartnerApiKey,
  cacheResponse({ namespace: "partner", ttlSeconds: 180 }),
  productController.getAllProducts
);

/**
 * @swagger
 * /api/partner/pets:
 *   get:
 *     summary: Partner - list pets (read-only)
 *     tags: [Partner]
 *     security:
 *       - partnerApiKey: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: species
 *         schema:
 *           type: string
 *       - in: query
 *         name: breed
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pet list
 */
router.get(
  "/pets",
  requirePartnerApiKey,
  cacheResponse({ namespace: "partner", ttlSeconds: 180 }),
  petController.getAllPets
);

module.exports = router;
