const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  species: {
    type: String,
    required: true,
    enum: ["dog", "cat", "bird", "rabbit", "other"],
  },
  breed: {
    type: String,
    trim: true,
  },
  age: {
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ["days", "weeks", "months", "years"],
      default: "months",
    },
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female"],
  },
  size: {
    type: String,
    required: true,
    enum: ["small", "medium", "large"],
  },
  color: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  mainImage: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  status: {
    type: String,
    enum: ["available", "pending", "adopted"],
    default: "available",
  },
  adoptionFee: {
    type: Number,
    default: 0,
  },
  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  goodWith: {
    children: {
      type: Boolean,
      default: false,
    },
    dogs: {
      type: Boolean,
      default: false,
    },
    cats: {
      type: Boolean,
      default: false,
    },
    otherAnimals: {
      type: Boolean,
      default: false,
    },
  },
  healthInfo: {
    vaccinated: {
      type: Boolean,
      default: false,
    },
    neutered: {
      type: Boolean,
      default: false,
    },
    microchipped: {
      type: Boolean,
      default: false,
    },
    specialNeeds: {
      type: Boolean,
      default: false,
    },
    specialNeedsDescription: String,
  },
  behavior: {
    energyLevel: {
      type: String,
      enum: ["low", "moderate", "high"],
      default: "moderate",
    },
    trainingLevel: {
      type: String,
      enum: ["none", "basic", "advanced"],
      default: "none",
    },
    socialness: {
      type: String,
      enum: ["shy", "moderate", "friendly"],
      default: "moderate",
    },
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

petSchema.index({ name: "text", description: "text", breed: "text" });

petSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Pet", petSchema);
