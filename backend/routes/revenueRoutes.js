const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenueController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.use(isAuthenticated);

router.get("/ledger", revenueController.getLedger);
router.get("/summary", isAdmin, revenueController.getRevenueSummary);
router.post("/payout", isAdmin, revenueController.processPayout);

module.exports = router;
