const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Reference to the product being reviewed
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Reference to the user who wrote the review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reference to the order (to verify purchase)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // Rating (1-5 stars)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review title
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Review content
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Images uploaded with the review
    images: [
      {
        type: String,
      },
    ],

    // Verified purchase indicator
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },

    // Helpful votes
    helpfulVotes: {
      type: Number,
      default: 0,
    },

    // Users who voted this review as helpful
    votedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Review status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    // Admin response to review
    adminResponse: {
      text: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, status: 1, rating: -1 });
reviewSchema.index({ user: 1 });

// Virtual for checking if review is recent (within 30 days)
reviewSchema.virtual("isRecent").get(function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt >= thirtyDaysAgo;
});

// Method to check if a user has voted this review as helpful
reviewSchema.methods.hasUserVoted = function (userId) {
  return this.votedBy.some((id) => id.equals(userId));
};

// Static method to calculate average rating for a product
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: productId, status: "approved" } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};

// Update product's average rating after review save/update
reviewSchema.post("save", async function () {
  const Product = mongoose.model("Product");
  const stats = await this.constructor.calculateAverageRating(this.product);
  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  });
});

// Update product's average rating after review deletion
reviewSchema.post("remove", async function () {
  const Product = mongoose.model("Product");
  const stats = await this.constructor.calculateAverageRating(this.product);
  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  });
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
