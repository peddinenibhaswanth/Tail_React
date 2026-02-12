const Product = require("../models/Product"); // Product controller

const Review = require("../models/Review");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const { deleteFiles } = require("../middleware/upload");
const { bumpNamespaceVersion } = require("../services/cacheService");

// @desc    Get all products with filters and pagination
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      petType,
      minPrice,
      maxPrice,
      onSale,
      featured,
      seller,
      search,
      sort = "-createdAt",
      inStock = true,
    } = req.query;

    const query = {};

    // Case-insensitive category matching using regex
    if (category) query.category = new RegExp(`^${category}$`, "i");
    if (petType) query.petType = new RegExp(`^${petType}$`, "i");
    if (seller) query.seller = seller;
    if (featured) query.featured = featured === "true";
    if (onSale) query.onSale = onSale === "true";
    if (inStock === "true") query.stock = { $gt: 0 };

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate("seller", "name sellerInfo.businessName email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Ensure images array is populated for backward compatibility
    products.forEach(product => {
      if ((!product.images || product.images.length === 0) && product.mainImage && product.mainImage !== "default-product.jpg") {
        product.images = [product.mainImage];
      }
    });

    const count = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalProducts: count,
        perPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name sellerInfo email phoneNumber"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Ensure images array is populated (for backward compatibility)
    if ((!product.images || product.images.length === 0) && product.mainImage && product.mainImage !== "default-product.jpg") {
      product.images = [product.mainImage];
    }

    const reviews = await Review.find({
      product: req.params.id,
      status: "approved",
    })
      .populate("user", "name profilePicture")
      .sort("-createdAt")
      .limit(10);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        reviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Seller/Admin)
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      seller:
        req.user.role === "seller"
          ? req.user._id
          : req.body.seller || req.user._id,
    };

    // Handle specifications object
    if (productData.brand || productData.specifications) {
      productData.specifications = {
        brand: productData.brand || "",
        material: productData.specifications || "",
      };
      delete productData.brand;
    }

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file) => file.filename);
      productData.mainImage = req.files[0].filename;
    }

    if (typeof productData.tags === "string") {
      productData.tags = productData.tags.split(",").map((tag) => tag.trim());
    }

    const product = await Product.create(productData);

    bumpNamespaceVersion("products").catch(() => {});

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      const filenames = req.files.map((file) => `products/${file.filename}`);
      deleteFiles(filenames);
    }

    res.status(400).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller/Admin)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.user.role === "seller" &&
      product.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    if (req.files && req.files.length > 0) {
      // APPEND new images to existing ones instead of replacing
      const currentImages = product.images || [];
      const newImages = req.files.map((file) => file.filename);
      const combined = [...currentImages, ...newImages];

      // Enforce max 6 images - if over limit, reject new uploads
      if (combined.length > 6) {
        const filenames = req.files.map((file) => `products/${file.filename}`);
        deleteFiles(filenames);
        return res.status(400).json({
          success: false,
          message: `Cannot add ${newImages.length} image(s). Product already has ${currentImages.length} image(s). Maximum is 6.`,
        });
      }

      req.body.images = combined;
      req.body.mainImage = combined[0];
    }

    if (typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    bumpNamespaceVersion("products").catch(() => {});

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller/Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.user.role === "seller" &&
      product.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this product",
      });
    }

    if (product.images && product.images.length > 0) {
      const imagePaths = product.images.map((img) => `products/${img}`);
      deleteFiles(imagePaths);
    }

    await product.deleteOne();

    bumpNamespaceVersion("products").catch(() => {});

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// @desc    Add images to existing product
// @route   POST /api/products/:id/images
// @access  Private (Seller/Admin)
exports.addImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.user.role === "seller" &&
      product.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided",
      });
    }

    const currentCount = product.images ? product.images.length : 0;
    const maxImages = 6;

    if (currentCount + req.files.length > maxImages) {
      // Delete uploaded files since we're rejecting
      const filenames = req.files.map((file) => `products/${file.filename}`);
      deleteFiles(filenames);
      return res.status(400).json({
        success: false,
        message: `Cannot add ${req.files.length} image(s). Product already has ${currentCount} image(s). Maximum is ${maxImages}.`,
      });
    }

    const newImages = req.files.map((file) => file.filename);
    product.images = [...(product.images || []), ...newImages];

    // Set mainImage if not already set
    if (!product.mainImage || product.mainImage === "default-product.jpg") {
      product.mainImage = product.images[0];
    }

    await product.save();

    res.json({
      success: true,
      message: "Images added successfully",
      data: product,
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      const filenames = req.files.map((file) => `products/${file.filename}`);
      deleteFiles(filenames);
    }
    res.status(500).json({
      success: false,
      message: "Error adding images",
      error: error.message,
    });
  }
};

// @desc    Delete a specific image from product
// @route   DELETE /api/products/:id/images/:imageIndex
// @access  Private (Seller/Admin)
exports.deleteImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.user.role === "seller" &&
      product.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= product.images.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid image index",
      });
    }

    // Delete the file from disk
    const deletedImage = product.images[imageIndex];
    deleteFiles([`products/${deletedImage}`]);

    // Remove from array
    product.images.splice(imageIndex, 1);

    // Update mainImage
    if (product.images.length > 0) {
      product.mainImage = product.images[0];
    } else {
      product.mainImage = "default-product.jpg";
    }

    await product.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: error.message,
    });
  }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private (Seller/Admin)
exports.updateStock = async (req, res) => {
  try {
    const { stock, operation } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.user.role === "seller" &&
      product.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    if (operation === "adjust") {
      product.stock += parseInt(stock);
    } else {
      product.stock = parseInt(stock);
    }

    if (product.stock < 0) product.stock = 0;

    await product.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating stock",
      error: error.message,
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      featured: true,
      stock: { $gt: 0 },
    })
      .populate("seller", "name sellerInfo.businessName")
      .sort("-createdAt")
      .limit(limit)
      .lean();

    // Ensure images array is populated for backward compatibility
    products.forEach(product => {
      if ((!product.images || product.images.length === 0) && product.mainImage && product.mainImage !== "default-product.jpg") {
        product.images = [product.mainImage];
      }
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching featured products",
      error: error.message,
    });
  }
};

// @desc    Get products on sale
// @route   GET /api/products/sale
// @access  Public
exports.getOnSaleProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    const products = await Product.find({
      onSale: true,
      stock: { $gt: 0 },
    })
      .populate("seller", "name sellerInfo.businessName")
      .sort("-createdAt")
      .limit(limit)
      .lean();

    // Ensure images array is populated for backward compatibility
    products.forEach(product => {
      if ((!product.images || product.images.length === 0) && product.mainImage && product.mainImage !== "default-product.jpg") {
        product.images = [product.mainImage];
      }
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sale products",
      error: error.message,
    });
  }
};

// @desc    Get products by seller
// @route   GET /api/products/seller/:sellerId
// @access  Public
exports.getProductsBySeller = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const products = await Product.find({ seller: req.params.sellerId })
      .populate("seller", "name sellerInfo.businessName")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Ensure images array is populated for backward compatibility
    products.forEach(product => {
      if ((!product.images || product.images.length === 0) && product.mainImage && product.mainImage !== "default-product.jpg") {
        product.images = [product.mainImage];
      }
    });

    const count = await Product.countDocuments({ seller: req.params.sellerId });

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalProducts: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller products",
      error: error.message,
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// ===========================================
// REVIEW CONTROLLER METHODS
// ===========================================

// @desc    Create a review for a product
// @route   POST /api/products/:id/reviews
// @access  Private (must have a delivered order containing this product)
exports.createReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;
    const { rating, title, comment, orderId } = req.body;

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Verify user has a delivered order containing this product
    const deliveredOrder = await Order.findOne({
      _id: orderId,
      customer: userId,
      status: "delivered",
      "items.product": productId,
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message:
          "You can only review products from your delivered orders",
      });
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      order: deliveredOrder._id,
      rating: parseInt(rating),
      title: title || `Review for ${product.name}`,
      comment: comment || "",
      verifiedPurchase: true,
      status: "approved",
    });

    // Populate user info for response
    await review.populate("user", "name profilePicture");

    // Fetch updated product with reviews
    const updatedProduct = await Product.findById(productId).populate(
      "seller",
      "name sellerInfo email phoneNumber"
    );

    const reviews = await Review.find({
      product: productId,
      status: "approved",
    })
      .populate("user", "name profilePicture")
      .sort("-createdAt")
      .limit(10);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      data: {
        ...updatedProduct.toObject(),
        reviews,
      },
    });
  } catch (error) {
    // Handle duplicate key error (user already reviewed)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating review",
      error: error.message,
    });
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const reviews = await Review.find({
      product: productId,
      status: "approved",
    })
      .populate("user", "name profilePicture")
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalReviews = await Review.countDocuments({
      product: productId,
      status: "approved",
    });

    // Calculate rating breakdown
    const ratingBreakdown = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Format breakdown as { 5: count, 4: count, ... }
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingBreakdown.forEach((r) => {
      breakdown[r._id] = r.count;
    });

    res.json({
      success: true,
      data: reviews,
      ratingBreakdown: breakdown,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private (review owner or admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check ownership or admin
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "co-admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    const productId = review.product;
    await review.deleteOne();

    // Manually recalculate product rating since deleteOne doesn't trigger remove hooks
    const stats = await Review.calculateAverageRating(productId);
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting review",
      error: error.message,
    });
  }
};

// @desc    Vote a review as helpful
// @route   POST /api/products/:id/reviews/:reviewId/helpful
// @access  Private
exports.voteHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const userId = req.user._id;

    // Check if user already voted
    if (review.hasUserVoted(userId)) {
      // Remove vote
      review.votedBy = review.votedBy.filter(
        (id) => !id.equals(userId)
      );
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
    } else {
      // Add vote
      review.votedBy.push(userId);
      review.helpfulVotes += 1;
    }

    await review.save();

    res.json({
      success: true,
      data: {
        helpfulVotes: review.helpfulVotes,
        hasVoted: review.hasUserVoted(userId),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating vote",
      error: error.message,
    });
  }
};

// @desc    Check which products from delivered orders can be reviewed
// @route   GET /api/products/reviews/check-eligibility
// @access  Private
exports.checkReviewEligibility = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all delivered orders for this user
    const deliveredOrders = await Order.find({
      customer: userId,
      status: "delivered",
    }).lean();

    if (!deliveredOrders.length) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Collect all product IDs from delivered orders
    const productItemMap = [];
    deliveredOrders.forEach((order) => {
      order.items.forEach((item) => {
        productItemMap.push({
          productId: item.product,
          orderId: order._id,
          orderNumber: order.orderNumber,
          productName: item.name,
          productImage: item.image,
          deliveredAt: order.updatedAt,
        });
      });
    });

    const productIds = productItemMap.map((p) => p.productId);

    // Get existing reviews by this user for these products
    const existingReviews = await Review.find({
      user: userId,
      product: { $in: productIds },
    })
      .select("product")
      .lean();

    const reviewedProductIds = new Set(
      existingReviews.map((r) => r.product.toString())
    );

    // Filter out already-reviewed products
    const unreviewedItems = productItemMap.filter(
      (item) => !reviewedProductIds.has(item.productId.toString())
    );

    res.json({
      success: true,
      data: unreviewedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking review eligibility",
      error: error.message,
    });
  }
};

// @desc    Get all reviews for a seller's products
// @route   GET /api/products/reviews/seller-reviews
// @access  Private (Seller/Admin)
exports.getSellerReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const sellerId = req.user._id;

    // Find all products owned by the seller
    const sellerProducts = await Product.find({ seller: sellerId })
      .select("_id name averageRating totalReviews")
      .lean();

    if (!sellerProducts.length) {
      return res.json({
        success: true,
        data: [],
        stats: { totalReviews: 0, averageRating: 0, productCount: 0 },
      });
    }

    const productIds = sellerProducts.map((p) => p._id);

    // Get reviews for all these products
    const reviews = await Review.find({
      product: { $in: productIds },
      status: "approved",
    })
      .populate("user", "name profilePicture")
      .populate("product", "name mainImage images")
      .sort("-createdAt")
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalReviews = await Review.countDocuments({
      product: { $in: productIds },
      status: "approved",
    });

    // Overall average rating for seller
    const ratingAgg = await Review.aggregate([
      { $match: { product: { $in: productIds }, status: "approved" } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const overallAvg =
      ratingAgg.length > 0 ? Math.round(ratingAgg[0].avg * 10) / 10 : 0;

    res.json({
      success: true,
      data: reviews,
      stats: {
        totalReviews,
        averageRating: overallAvg,
        productCount: sellerProducts.length,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller reviews",
      error: error.message,
    });
  }
};

// @desc    Get all reviews across platform (admin)
// @route   GET /api/products/reviews/admin-all
// @access  Private (Admin/Co-admin)
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "approved" } = req.query;

    const filter = {};
    if (status !== "all") filter.status = status;

    const reviews = await Review.find(filter)
      .populate("user", "name profilePicture email")
      .populate("product", "name mainImage images seller")
      .sort("-createdAt")
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Review.countDocuments(filter);

    // Platform-wide stats
    const statsAgg = await Review.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const ratingDist = await Review.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDist.forEach((r) => {
      breakdown[r._id] = r.count;
    });

    res.json({
      success: true,
      data: reviews,
      stats: {
        totalReviews: statsAgg[0]?.totalCount || 0,
        averageRating:
          statsAgg[0]?.avgRating
            ? Math.round(statsAgg[0].avgRating * 10) / 10
            : 0,
        ratingBreakdown: breakdown,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching all reviews",
      error: error.message,
    });
  }
};
