const mongoose = require("mongoose");

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
    enum: [
      "dog",
      "cat",
      "bird",
      "rabbit",
      "fish",
      "hamster",
      "other",
      "Dog",
      "Cat",
      "Bird",
      "Rabbit",
      "Fish",
      "Hamster",
      "Other",
    ],
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
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
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

appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Appointment", appointmentSchema);
