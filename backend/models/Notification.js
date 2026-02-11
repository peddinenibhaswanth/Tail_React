const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         recipient:
 *           type: string
 *         type:
 *           type: string
 *           enum:
 *             - order_placed
 *             - order_status
 *             - order_cancelled
 *             - order_delivered
 *             - appointment_booked
 *             - appointment_status
 *             - appointment_cancelled
 *             - appointment_confirmed
 *             - appointment_completed
 *             - adoption_submitted
 *             - adoption_status
 *             - adoption_approved
 *             - adoption_rejected
 *             - general
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         relatedModel:
 *           type: string
 *           nullable: true
 *           enum: [Order, Appointment, AdoptionApplication, Pet, null]
 *         relatedId:
 *           type: string
 *           nullable: true
 *         link:
 *           type: string
 *           nullable: true
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "order_placed",
      "order_status",
      "order_cancelled",
      "order_delivered",
      "appointment_booked",
      "appointment_status",
      "appointment_cancelled",
      "appointment_confirmed",
      "appointment_completed",
      "adoption_submitted",
      "adoption_status",
      "adoption_approved",
      "adoption_rejected",
      "general",
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  // Reference to related entity
  relatedModel: {
    type: String,
    enum: ["Order", "Appointment", "AdoptionApplication", "Pet", null],
    default: null,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  // Link for navigation when user clicks notification
  link: {
    type: String,
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
