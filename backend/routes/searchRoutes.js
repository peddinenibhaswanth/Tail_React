const express = require("express");
const router = express.Router();

const searchController = require("../controllers/searchController");

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search endpoints (Solr-backed when enabled; MongoDB fallback)
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search across products and pets
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max results (1-50)
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/", searchController.globalSearch);

module.exports = router;
