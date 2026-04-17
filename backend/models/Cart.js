const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: The ID of the product
 *         quantity:
 *           type: number
 *           description: The quantity of the product
 *         price:
 *           type: number
 *           description: The price of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         image:
 *           type: string
 *           description: The image of the product
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         customer:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         subtotal:
 *           type: number
 *         tax:
 *           type: number
 *         shipping:
 *           type: number
 *         total:
 *           type: number
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
  },
  image: {
    type: String,
  },
});

const cartSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  shipping: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

cartSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  this.tax = this.subtotal * 0.18; // 18% GST

  this.shipping = this.subtotal > 500 ? 0 : 50;

  this.total = this.subtotal + this.tax + this.shipping;

  this.updatedAt = Date.now();
};

cartSchema.pre("save", function (next) {
  this.calculateTotals();
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
