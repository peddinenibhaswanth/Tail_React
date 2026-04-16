const Transaction = require("../models/Transaction");
const Revenue = require("../models/Revenue");
const User = require("../models/User");
const mongoose = require("mongoose");

// @desc    Get financial ledger
// @route   GET /api/revenue/ledger
// @access  Private (Admin/Seller/Veterinary)
exports.getLedger = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, startDate, endDate } = req.query;
        const query = {};

        // Sellers/Vets can only see their own transactions
        if (req.user.role === "seller" || req.user.role === "veterinary") {
            query.user = req.user._id;
        } else if (req.user.role !== "admin" && req.user.role !== "co-admin") {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (type) query.type = type;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .populate("order", "orderNumber total status")
            .populate("appointment", "petName service consultationFee status")
            .populate("user", "name email role")
            .sort("-createdAt")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalTransactions: count,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching ledger", error: error.message });
    }
};

// @desc    Get platform financial summary (Admin)
// @route   GET /api/revenue/summary
// @access  Private (Admin)
exports.getRevenueSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const summary = await Revenue.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$summary.totalRevenue" },
                    totalTax: { $sum: "$summary.totalTax" },
                    totalCommission: { $sum: "$summary.totalCommission" },
                    totalPayouts: { $sum: "$summary.totalPayouts" },
                    totalOrders: { $sum: "$summary.totalOrders" },
                    totalTransactions: { $sum: "$summary.totalTransactions" },
                }
            }
        ]);

        res.json({
            success: true,
            data: summary[0] || {
                totalRevenue: 0,
                totalTax: 0,
                totalCommission: 0,
                totalPayouts: 0,
                totalOrders: 0,
                totalTransactions: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching summary", error: error.message });
    }
};

// @desc    Request/Process Payout (Admin)
// @route   POST /api/revenue/payout
// @access  Private (Admin)
exports.processPayout = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { userId, amount, method, referenceId, notes } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid payout details" });
        }

        const user = await User.findById(userId).session(session);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance for payout" });
        }

        // 1. Deduct from user balance
        user.balance -= amount;
        await user.save({ session });

        // 2. Create Payout Transaction
        const payoutTxn = new Transaction({
            user: userId,
            type: "payout",
            amount: -amount,
            netAmount: -amount,
            status: "completed",
            description: notes || `Payout of ₹${amount} via ${method || "Bank Transfer"}`,
            paymentGateway: {
                provider: method || "Manual",
                transactionId: referenceId || "N/A",
                status: "completed"
            }
        });
        await payoutTxn.save({ session });

        // 3. Update Daily Revenue Summary (Payouts track)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const periodIdentifier = today.toISOString().split("T")[0];

        let revenueRecord = await Revenue.findOne({ periodType: "daily", periodIdentifier }).session(session);
        if (!revenueRecord) {
            revenueRecord = new Revenue({
                date: today, periodType: "daily", periodIdentifier,
                summary: { totalRevenue: 0, totalTax: 0, totalCommission: 0, totalPayouts: 0, totalOrders: 0, totalTransactions: 0 }
            });
        }
        revenueRecord.summary.totalPayouts += amount;
        await revenueRecord.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: "Payout processed successfully",
            data: {
                newBalance: user.balance,
                transactionId: payoutTxn.transactionId
            }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: "Error processing payout", error: error.message });
    }
};
