const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Pet:
 *       type: object
 *       required:
 *         - name
 *         - species
 *         - age
 *         - gender
 *         - size
 *         - color
 *         - description
 *         - mainImage
 *         - shelter
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the pet
 *         name:
 *           type: string
 *           description: The name of the pet
 *         species:
 *           type: string
 *           description: The species of the pet
 *           enum: [dog, cat, bird, rabbit, other]
 *         breed:
 *           type: string
 *           description: The breed of the pet
 *         age:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *               enum: [days, weeks, months, years]
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         status:
 *           type: string
 *           description: The adoption status of the pet
 *           enum: [available, pending, adopted]
 *         shelter:
 *           type: string
 *           description: The ID of the shelter or organization user
 *     PetCreateRequest:
 *       type: object
 *       description: Multipart form fields for creating a pet (use in Swagger UI)
 *       required:
 *         - name
 *         - species
 *         - age[value]
 *         - gender
 *         - size
 *         - color
 *         - description
 *         - images
 *       properties:
 *         name:
 *           type: string
 *         species:
 *           type: string
 *           enum: [dog, cat, bird, rabbit, other]
 *         breed:
 *           type: string
 *         age[value]:
 *           type: number
 *           description: Age value (FormData field name must be exactly age[value])
 *         age[unit]:
 *           type: string
 *           description: Age unit (FormData field name must be exactly age[unit])
 *           enum: [days, weeks, months, years]
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         size:
 *           type: string
 *           enum: [small, medium, large]
 *         color:
 *           type: string
 *         description:
 *           type: string
 *         adoptionFee:
 *           type: number
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Upload 1+ images; the first becomes mainImage
 *     PetUpdateRequest:
 *       type: object
 *       description: Multipart form fields for updating a pet (all fields optional)
 *       properties:
 *         name:
 *           type: string
 *         species:
 *           type: string
 *           enum: [dog, cat, bird, rabbit, other]
 *         breed:
 *           type: string
 *         age[value]:
 *           type: number
 *         age[unit]:
 *           type: string
 *           enum: [days, weeks, months, years]
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         size:
 *           type: string
 *           enum: [small, medium, large]
 *         color:
 *           type: string
 *         description:
 *           type: string
 *         adoptionFee:
 *           type: number
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *       example:
 *         id: 60d0fe4f5311236168a109cc
 *         name: "Buddy"
 *         species: "dog"
 *         breed: "Golden Retriever"
 *         age: { value: 2, unit: "years" }
 *         gender: "male"
 *         status: "available"
 *         shelter: "60d0fe4f5311236168a109ce"
 */

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
