const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         transactionId:
 *           type: string
 *         order:
 *           type: string
 *           nullable: true
 *         appointment:
 *           type: string
 *           nullable: true
 *         adoption:
 *           type: string
 *           nullable: true
 *         user:
 *           type: string
 *         type:
 *           type: string
 *           enum: [sale, refund, payout, commission_fee, tax_payment]
 *         amount:
 *           type: number
 *         tax:
 *           type: number
 *         commission:
 *           type: number
 *         netAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, reversed]
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const transactionSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String,
            unique: true,
            default: () =>
                `TXN-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)
                    .toUpperCase()}`,
        },
        // Reference to what triggered this
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
        },
        adoption: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdoptionApplication",
        },
        // The party whose balance is being affected (Seller, Vet, or Admin)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["sale", "refund", "payout", "commission_fee", "tax_payment"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        commission: {
            type: Number,
            default: 0,
        },
        netAmount: {
            type: Number,
            required: true,
        },
        paymentGateway: {
            provider: String,
            transactionId: String,
            status: String,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "reversed"],
            default: "completed",
        },
        description: String,
        metadata: mongoose.Schema.Types.Mixed,
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ appointment: 1 });
transactionSchema.index({ adoption: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
