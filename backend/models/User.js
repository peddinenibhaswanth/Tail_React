const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
  role: {
    type: String,
    enum: ["customer", "seller", "veterinary", "admin", "co-admin"],
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
        this.role === "admin" ||
        this.role === "co-admin"
      );
    },
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
    clinicAddress: String,
    licenseNumber: String,
    specialization: [String],
    experience: Number,
    consultationFee: Number,
    commissionRate: {
      type: Number,
      default: 10, // Default 10%
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

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
