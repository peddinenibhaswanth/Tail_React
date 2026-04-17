const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - category
 *         - petType
 *         - stock
 *         - seller
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: A detailed description of the product
 *         price:
 *           type: number
 *           format: float
 *           description: The price of the product
 *         category:
 *           type: string
 *           description: The category of the product
 *           enum: [food, toys, accessories, grooming, health, training, other]
 *         petType:
 *           type: string
 *           description: The type of pet this product is for
 *           enum: [dog, cat, bird, rabbit, all, other]
 *         stock:
 *           type: integer
 *           description: The available stock quantity
 *         seller:
 *           type: string
 *           description: The ID of the user who is selling the product
 *         averageRating:
 *           type: number
 *           format: float
 *           description: The average rating of the product
 *         totalReviews:
 *           type: integer
 *           description: The total number of reviews for the product
 *       example:
 *         id: 60d0fe4f5311236168a109cb
 *         name: "Durable Dog Chew Toy"
 *         description: "A long-lasting toy for active dogs."
 *         price: 15.99
 *         category: "toys"
 *         petType: "dog"
 *         stock: 150
 *         seller: "60d0fe4f5311236168a109ca"
 *         averageRating: 4.5
 *         totalReviews: 82
 */

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
    default: "default-product.jpg",
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
  discountPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  specifications: {
    weight: String,
    dimensions: String,
    material: String,
    brand: String,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
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
productSchema.index({ category: 1, petType: 1, price: 1 });

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
