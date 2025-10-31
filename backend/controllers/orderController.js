const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Revenue = require("../models/Revenue");

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate stock and calculate totals
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Some products in cart are no longer available",
        });
      }

      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
        });
      }
    }

    const { shippingAddress, paymentMethod, paymentDetails } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // Create order items
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      image: item.product.mainImage,
      seller: item.product.seller,
    }));

    // Calculate pricing
    const itemsPrice = orderItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const taxPrice = itemsPrice * 0.18; // 18% GST
    const shippingPrice = itemsPrice > 1000 ? 0 : 50;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentDetails,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderStatus: "pending",
    });

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Populate order for response
    await order.populate([
      { path: "user", select: "name email phoneNumber" },
      { path: "orderItems.product", select: "name mainImage" },
      { path: "orderItems.seller", select: "name sellerInfo.businessName" },
    ]);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};

// @desc    Get all orders (customer's own orders)
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user._id };
    if (status) query.orderStatus = status;

    const orders = await Order.find(query)
      .populate("orderItems.product", "name mainImage")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phoneNumber")
      .populate("orderItems.product", "name mainImage")
      .populate("orderItems.seller", "name email sellerInfo");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check
    if (
      req.user.role === "customer" &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    // Seller can only see their own items
    if (req.user.role === "seller") {
      const sellerItems = order.orderItems.filter(
        (item) =>
          item.seller && item.seller._id.toString() === req.user._id.toString()
      );

      if (sellerItems.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this order",
        });
      }

      // Return order with only seller's items
      order.orderItems = sellerItems;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Seller/Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Seller authorization
    if (req.user.role === "seller") {
      const hasSellerItems = order.orderItems.some(
        (item) =>
          item.seller && item.seller.toString() === req.user._id.toString()
      );

      if (!hasSellerItems) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this order",
        });
      }
    }

    // Status transition validation
    if (
      order.orderStatus === "cancelled" ||
      order.orderStatus === "delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${order.orderStatus} order`,
      });
    }

    order.orderStatus = status;

    if (status === "delivered") {
      order.deliveredAt = Date.now();
      order.paymentStatus = "completed";

      // Record revenue
      await Revenue.create({
        date: new Date(),
        sales: {
          productSales: order.itemsPrice,
          count: order.orderItems.reduce((acc, item) => acc + item.quantity, 0),
        },
        totalRevenue: order.totalPrice,
      });
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
};

// @desc    Update payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private (Admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "failed",
      "refunded",
    ];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = paymentStatus;
    if (transactionId) {
      order.paymentDetails = order.paymentDetails || {};
      order.paymentDetails.transactionId = transactionId;
    }

    if (paymentStatus === "completed") {
      order.paidAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,
      message: "Payment status updated",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating payment status",
      error: error.message,
    });
  }
};

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Customer can only cancel their own orders
    if (
      req.user.role === "customer" &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Cannot cancel delivered or already cancelled orders
    if (
      order.orderStatus === "delivered" ||
      order.orderStatus === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${order.orderStatus} order`,
      });
    }

    // Customers can only cancel pending orders
    if (req.user.role === "customer" && order.orderStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "You can only cancel pending orders. Please contact support.",
      });
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = Date.now();
    order.cancelledBy = req.user._id;

    // Restore product stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error cancelling order",
      error: error.message,
    });
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller/my-orders
// @access  Private (Seller)
exports.getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const matchStage = {
      "orderItems.seller": req.user._id,
    };

    if (status) {
      matchStage.orderStatus = status;
    }

    const orders = await Order.find(matchStage)
      .populate("user", "name email phoneNumber")
      .populate("orderItems.product", "name mainImage")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter order items to show only seller's items
    orders.forEach((order) => {
      order.orderItems = order.orderItems.filter(
        (item) =>
          item.seller && item.seller.toString() === req.user._id.toString()
      );
    });

    const count = await Order.countDocuments(matchStage);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller orders",
      error: error.message,
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user, seller } = req.query;

    const query = {};
    if (status) query.orderStatus = status;
    if (user) query.user = user;
    if (seller) query["orderItems.seller"] = seller;

    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("orderItems.product", "name")
      .populate("orderItems.seller", "name sellerInfo.businessName")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (Admin/Seller)
exports.getOrderStats = async (req, res) => {
  try {
    const matchStage =
      req.user.role === "seller" ? { "orderItems.seller": req.user._id } : {};

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments(matchStage);
    const totalRevenue = await Order.aggregate([
      { $match: { ...matchStage, orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics",
      error: error.message,
    });
  }
};
