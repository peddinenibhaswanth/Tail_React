const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     TimeSlot:
 *       type: object
 *       properties:
 *         start:
 *           type: string
 *         end:
 *           type: string
 *     CustomerAddress:
 *       type: object
 *       properties:
 *         line1:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         pincode:
 *           type: string
 *         coordinates:
 *           type: array
 *           items:
 *             type: number
 *     Appointment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         customer:
 *           type: string
 *         veterinary:
 *           type: string
 *         petName:
 *           type: string
 *         petType:
 *           type: string
 *           enum: [dog, cat, bird, rabbit, fish, hamster, other]
 *         petAge:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         timeSlot:
 *           $ref: '#/components/schemas/TimeSlot'
 *         reason:
 *           type: string
 *         consultationMode:
 *           type: string
 *           enum: [in-clinic, home-visit, video-consultation]
 *         customerAddress:
 *           $ref: '#/components/schemas/CustomerAddress'
 *         videoCallLink:
 *           type: string
 *         isEmergency:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [pending, confirmed, in-progress, completed, cancelled, no-show]
 *         cancelledBy:
 *           type: string
 *         cancelledByRole:
 *           type: string
 *           enum: [customer, veterinary, admin, co-admin]
 *         notes:
 *           type: string
 *         consultationFee:
 *           type: number
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const appointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  veterinary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  petName: {
    type: String,
    required: true,
    trim: true,
  },
  petType: {
    type: String,
    required: true,
    lowercase: true,
    enum: ["dog", "cat", "bird", "rabbit", "fish", "hamster", "other"],
  },
  petAge: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  timeSlot: {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  reason: {
    type: String,
    required: true,
  },
  consultationMode: {
    type: String,
    enum: ["in-clinic", "home-visit", "video-consultation"],
    default: "in-clinic",
  },
  customerAddress: {
    line1: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: [Number], // [lng, lat]
  },
  videoCallLink: String,
  isEmergency: { type: Boolean, default: false },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
      "no-show",
    ],
    default: "pending",
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cancelledByRole: {
    type: String,
    enum: ["customer", "veterinary", "admin", "co-admin"],
  },
  notes: String,
  consultationFee: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

appointmentSchema.index({ customer: 1, date: 1 });
appointmentSchema.index({ veterinary: 1, date: 1 });
appointmentSchema.index({
  veterinary: 1,
  date: 1,
  status: 1,
  "timeSlot.start": 1,
});

appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Appointment", appointmentSchema);
