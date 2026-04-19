const Product = require("../models/Product"); // Product controller

const Review = require("../models/Review");
const Order = require("../models/Order");
const { deleteFiles } = require("../middleware/upload");

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

    // Normalize to enum values so Mongo can use indexes
    if (category) query.category = String(category).toLowerCase();
    if (petType) query.petType = String(petType).toLowerCase();
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

    const reviews = await Review.find({
      product: req.params.id,
      status: "approved",
    })
      .populate("user", "name profileImage")
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
      productData.images = req.files.map(
        (file) => file.cloudinaryUrl || file.filename
      );
      productData.mainImage = req.files[0].cloudinaryUrl || req.files[0].filename;
    }

    if (typeof productData.tags === "string") {
      productData.tags = productData.tags.split(",").map((tag) => tag.trim());
    }

    const product = await Product.create(productData);

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
      if (product.images && product.images.length > 0) {
        const oldImages = product.images.map((img) => `products/${img}`);
        deleteFiles(oldImages);
      }

      req.body.images = req.files.map((file) => file.cloudinaryUrl || file.filename);
      req.body.mainImage = req.files[0].cloudinaryUrl || req.files[0].filename;
    }

    if (typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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

// @desc    Get approved reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.id,
      status: "approved",
    })
      .populate("user", "name profileImage")
      .sort("-createdAt");

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

// @desc    Create a review for a delivered order's product
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { rating, title, comment, orderId } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (String(order.customer) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to review this order",
      });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be reviewed",
      });
    }

    const productInOrder = order.items.some(
      (item) => String(item.product) === String(product._id)
    );

    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: "This product is not part of the specified order",
      });
    }

    const reviewTitle = (title || "Review").toString().trim().slice(0, 100);
    const reviewComment = (comment || "No comment provided.")
      .toString()
      .trim()
      .slice(0, 1000);

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      order: order._id,
      rating: Number(rating),
      title: reviewTitle || "Review",
      comment: reviewComment || "No comment provided.",
      status: "approved",
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    // Duplicate review per user+product hits unique index
    if (error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }
    res.status(400).json({
      success: false,
      message: "Error creating review",
      error: error.message,
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.reviewId,
      product: req.params.id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const isAdminUser =
      req.user && (req.user.role === "admin" || req.user.role === "co-admin");
    const isOwner = String(review.user) === String(req.user._id);

    if (!isAdminUser && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    await review.remove();

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
    const review = await Review.findOne({
      _id: req.params.reviewId,
      product: req.params.id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const alreadyVoted = review.votedBy.some(
      (id) => String(id) === String(req.user._id)
    );

    if (!alreadyVoted) {
      review.votedBy.push(req.user._id);
      review.helpfulVotes = (review.helpfulVotes || 0) + 1;
      await review.save();
    }

    res.json({
      success: true,
      message: "Vote recorded",
      data: {
        helpfulVotes: review.helpfulVotes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error voting review",
      error: error.message,
    });
  }
};

// @desc    Add images to an existing product
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
      String(product.seller) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    const newImages = (req.files || []).map((f) => f.cloudinaryUrl || f.filename);
    if (newImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    product.images = [...(product.images || []), ...newImages];
    if (!product.mainImage) {
      product.mainImage = newImages[0];
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

// @desc    Delete an image from a product by index
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
      String(product.seller) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    const index = Number(req.params.imageIndex);
    if (!Number.isInteger(index) || index < 0 || index >= (product.images || []).length) {
      return res.status(400).json({
        success: false,
        message: "Invalid image index",
      });
    }

    const [removed] = product.images.splice(index, 1);
    if (removed) {
      deleteFiles([`products/${removed}`]);
    }

    if (product.mainImage === removed) {
      product.mainImage = product.images[0] || "default-product.jpg";
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

// @desc    Check which delivered products the user can review
// @route   GET /api/products/reviews/check-eligibility
// @access  Private
exports.checkReviewEligibility = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
      status: "delivered",
    }).select("items.product");

    const deliveredProductIds = Array.from(
      new Set(
        orders
          .flatMap((o) => o.items)
          .map((i) => String(i.product))
          .filter(Boolean)
      )
    );

    if (deliveredProductIds.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const existing = await Review.find({
      user: req.user._id,
      product: { $in: deliveredProductIds },
    }).select("product");

    const reviewed = new Set(existing.map((r) => String(r.product)));
    const eligibleIds = deliveredProductIds.filter((id) => !reviewed.has(id));

    const products = await Product.find({ _id: { $in: eligibleIds } }).lean();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking review eligibility",
      error: error.message,
    });
  }
};

// @desc    Get all reviews for the authenticated seller's products
// @route   GET /api/products/reviews/seller-reviews
// @access  Private (Seller/Admin)
exports.getSellerReviews = async (req, res) => {
  try {
    // Admin/co-admin can optionally pass sellerId to inspect, otherwise show all
    let sellerId = null;
    if (req.user.role === "seller") {
      sellerId = req.user._id;
    } else if (req.query && req.query.sellerId) {
      sellerId = req.query.sellerId;
    }

    let productFilter = {};
    if (sellerId) {
      const sellerProducts = await Product.find({ seller: sellerId }).select("_id");
      productFilter.product = { $in: sellerProducts.map((p) => p._id) };
    }

    const reviews = await Review.find(productFilter)
      .populate("product", "name seller")
      .populate("user", "name profileImage")
      .sort("-createdAt");

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller reviews",
      error: error.message,
    });
  }
};

// @desc    Admin: get all reviews across all products
// @route   GET /api/products/reviews/admin-all
// @access  Private (Admin/Co-Admin)
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("product", "name seller")
      .populate("user", "name profileImage")
      .sort("-createdAt");

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};
