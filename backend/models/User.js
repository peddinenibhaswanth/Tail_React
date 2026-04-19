const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         role:
 *           type: string
 *           description: The role of the user
 *           enum: [customer, seller, veterinary, organization, admin, co-admin]
 *         phone:
 *           type: string
 *           description: The phone number of the user
 *         profileImage:
 *           type: string
 *           description: URL to the user's profile image
 *         isApproved:
 *           type: boolean
 *           description: Whether the user's role is approved by an admin (for sellers, vets, etc.)
 *       example:
 *         id: 60d0fe4f5311236168a109ca
 *         name: John Doe
 *         email: johndoe@example.com
 *         role: customer
 *         isApproved: true
 */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["customer", "seller", "veterinary", "organization", "admin", "co-admin"],
    default: "customer",
  },
  phone: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
    default: "/uploads/users/default-avatar.png",
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  isApproved: {
    type: Boolean,
    default: function () {
      return (
        this.role === "customer" ||
        this.role === "admin"
      );
    },
  },
  organizationInfo: {
    orgName: String,
    orgAddress: String,
    orgPhone: String,
    registrationNumber: String,
    description: String,
  },
  sellerInfo: {
    businessName: String,
    businessAddress: String,
    businessPhone: String,
    taxId: String,
    description: String,
    commissionRate: {
      type: Number,
      default: 10, // Default 10%
    },
  },
  vetInfo: {
    clinicName: String,
    // Structured clinic address
    clinicAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
    fullAddress: String, // Pre-computed display string
    // GeoJSON coordinates [longitude, latitude]
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    licenseNumber: String,
    specialization: [String],
    experience: Number,
    // Consultation modes and fees
    consultationModes: [
      {
        type: String,
        enum: ["in-clinic", "home-visit", "video-consultation"],
      },
    ],
    consultationFees: {
      "in-clinic": { type: Number, default: 0 },
      "home-visit": { type: Number, default: 0 },
      "video-consultation": { type: Number, default: 0 },
    },
    consultationFee: Number, // Legacy / default fee
    homeVisitRadius: { type: Number, default: 10 }, // km
    commissionRate: {
      type: Number,
      default: 10,
    },
    availableDays: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
    ],
    availableTimeSlots: [
      {
        start: String,
        end: String,
      },
    ],
    isEmergencyAvailable: { type: Boolean, default: false },
  },
  balance: {
    type: Number,
    default: 0, // Current payable balance for Sellers/Vets
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

// Geospatial index for vet location search
userSchema.index({ "vetInfo.coordinates": "2dsphere" });
// Text indexes for city/pincode search
userSchema.index({ "vetInfo.clinicAddress.city": 1 });
userSchema.index({ "vetInfo.clinicAddress.pincode": 1 });
// Common listing filter: approved users by role (veterinary/seller)
userSchema.index({ role: 1, isApproved: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

userSchema.methods.comparePassword = async function (candidatePassword) {
  const storedPassword = this.password;
  if (typeof storedPassword !== "string" || storedPassword.length === 0) {
    return false;
  }

  // Normal path: bcrypt hashed password
  if (isBcryptHash(storedPassword)) {
    return await bcrypt.compare(candidatePassword, storedPassword);
  }

  // Legacy path: plaintext passwords (e.g. records inserted directly in MongoDB).
  // If it matches, upgrade the stored password to bcrypt by saving the document.
  const isMatch = candidatePassword === storedPassword;
  if (isMatch) {
    this.password = candidatePassword;
    this.markModified("password");
    await this.save();
  }
  return isMatch;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
