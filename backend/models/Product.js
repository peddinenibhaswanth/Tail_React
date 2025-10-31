const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "food",
      "toys",
      "accessories",
      "grooming",
      "health",
      "training",
      "other",
    ],
  },
  petType: {
    type: String,
    required: true,
    enum: ["dog", "cat", "bird", "rabbit", "all", "other"],
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
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  onSale: {
    type: Boolean,
    default: false,
  },
  salePrice: {
    type: Number,
    min: 0,
  },
  specifications: {
    weight: String,
    dimensions: String,
    material: String,
    brand: String,
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

productSchema.index({ name: "text", description: "text" });

productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  if (this.onSale && this.salePrice >= this.price) {
    this.salePrice = this.price * 0.9;
  }

  next();
});

productSchema.virtual("finalPrice").get(function () {
  return this.onSale && this.salePrice ? this.salePrice : this.price;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
