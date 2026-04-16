const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Revenue = require("../models/Revenue");

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    // Cart model uses 'customer' field
    const cart = await Cart.findOne({ customer: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate stock
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

    const { shippingAddress, paymentMethod } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const missingFields = [];
    if (!shippingAddress.fullName) missingFields.push("full name");
    if (!shippingAddress.phone) missingFields.push("phone number");
    if (!shippingAddress.street) missingFields.push("street address");
    if (!shippingAddress.city) missingFields.push("city");
    if (!shippingAddress.state) missingFields.push("state");
    if (!shippingAddress.zipCode) missingFields.push("PIN code");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please provide: ${missingFields.join(", ")}`,
      });
    }

    // Set default country
    if (!shippingAddress.country) {
      shippingAddress.country = "India";
    }

    // Create order items matching Order model schema
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      seller: item.product.seller,
      name: item.product.name,
      price: item.price || item.product.price,
      quantity: item.quantity,
      image: item.product.mainImage || item.image,
    }));

    // Calculate pricing
    const subtotal = orderItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 1000 ? 0 : 50;
    const total = subtotal + tax + shipping;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create order - using correct field names from Order model
    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || "India",
      },
      paymentMethod: paymentMethod || "cod",
      status: "pending",
      paymentStatus: "pending",
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
      { path: "customer", select: "name email phoneNumber" },
      { path: "items.product", select: "name mainImage" },
      { path: "items.seller", select: "name sellerInfo.businessName" },
    ]);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(400).json({
      success: false,
      message: "Error creating order: " + error.message,
      error: error.message,
    });
  }
};

// @desc    Get all orders (customer's own orders)
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("items.product", "name mainImage")
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
      .populate("customer", "name email phoneNumber")
      .populate("items.product", "name mainImage")
      .populate("items.seller", "name email sellerInfo");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check - customer can only see their own orders
    if (
      req.user.role === "customer" &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    // Seller can only see orders containing their products
    if (req.user.role === "seller") {
      const sellerItems = order.items.filter(
        (item) =>
          item.seller && item.seller._id.toString() === req.user._id.toString()
      );

      if (sellerItems.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this order",
        });
      }
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
      const hasSellerItems = order.items.some(
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
    if (order.status === "cancelled" || order.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${order.status} order`,
      });
    }

    order.status = status;

    if (status === "delivered") {
      order.paymentStatus = "paid";

      // Record revenue for this order
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const periodIdentifier = today.toISOString().split("T")[0]; // YYYY-MM-DD

        // Find or create revenue record for today
        let revenueRecord = await Revenue.findOne({
          periodType: "daily",
          periodIdentifier,
        });

        if (!revenueRecord) {
          revenueRecord = new Revenue({
            date: today,
            periodType: "daily",
            periodIdentifier,
            productSales: {
              totalOrders: 0,
              totalRevenue: 0,
              totalProfit: 0,
              averageOrderValue: 0,
            },
            summary: {
              totalRevenue: 0,
              totalOrders: 0,
              totalTransactions: 0,
            },
          });
        }

        // Update revenue with this order
        revenueRecord.productSales.totalOrders += 1;
        revenueRecord.productSales.totalRevenue += order.total;
        revenueRecord.productSales.averageOrderValue =
          revenueRecord.productSales.totalRevenue /
          revenueRecord.productSales.totalOrders;

        // Update summary
        revenueRecord.summary.totalRevenue += order.total;
        revenueRecord.summary.totalOrders += 1;
        revenueRecord.summary.totalTransactions += 1;

        // Add seller metrics
        const User = require("../models/User");
        for (const item of order.items) {
          const sellerIndex = revenueRecord.sellerMetrics.findIndex(
            (sm) => sm.seller && sm.seller.toString() === item.seller.toString()
          );

          const itemRevenue = item.price * item.quantity;
          const commission = itemRevenue * 0.1; // 10% commission

          if (sellerIndex === -1) {
            // Get seller info
            const seller = await User.findById(item.seller);
            revenueRecord.sellerMetrics.push({
              seller: item.seller,
              name: seller?.name || "Unknown",
              totalSales: item.quantity,
              totalRevenue: itemRevenue,
              commission: commission,
            });
          } else {
            revenueRecord.sellerMetrics[sellerIndex].totalSales += item.quantity;
            revenueRecord.sellerMetrics[sellerIndex].totalRevenue += itemRevenue;
            revenueRecord.sellerMetrics[sellerIndex].commission += commission;
          }
        }

        await revenueRecord.save();
        console.log(`Revenue recorded for order ${order.orderNumber}`);
      } catch (revErr) {
        console.error("Revenue recording error:", revErr);
        // Don't fail the order update if revenue recording fails
      }
    }

    if (status === "cancelled") {
      // Handle cancellation financial reversal if it was already paid
      if (order.paymentStatus === "paid") {
        try {
          const Transaction = require("../models/Transaction");
          const Revenue = require("../models/Revenue");
          const User = require("../models/User");

          // Record a reversal transaction
          const reversalTxn = new Transaction({
            order: order._id,
            user: order.customer, // Primary user is customer for the main sale amount
            type: "refund",
            amount: -order.total,
            tax: -order.tax,
            netAmount: -(order.total - order.tax),
            description: `Order ${order.orderNumber} cancelled and refunded.`,
          });
          await reversalTxn.save();

          // Update seller balances (reverse the net gain)
          for (const item of order.items) {
            const seller = await User.findById(item.seller);
            if (seller) {
              const commissionRate = seller.sellerInfo?.commissionRate || 10;
              const itemTotal = item.price * item.quantity;
              const commission = itemTotal * (commissionRate / 100);
              const sellerNet = itemTotal - commission;

              seller.balance -= sellerNet;
              await seller.save();

              // Record seller-specific reversal in ledger
              await Transaction.create({
                order: order._id,
                user: item.seller,
                type: "refund",
                amount: -itemTotal,
                commission: -commission,
                netAmount: -sellerNet,
                description: `Reversal for item ${item.name} in cancelled order ${order.orderNumber}`,
              });
            }
          }
        } catch (err) {
          console.error("Cancellation financial reversal error:", err);
        }
      }
      order.paymentStatus = "refunded";
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

    const validStatuses = ["pending", "paid", "failed", "refunded"];
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

    if (paymentStatus === "paid") {
      order.paymentDetails = order.paymentDetails || {};
      order.paymentDetails.paidAt = Date.now();

      // Trigger Revenue and Ledger recording when paid
      try {
        const Transaction = require("../models/Transaction");
        const Revenue = require("../models/Revenue");
        const User = require("../models/User");

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const periodIdentifier = today.toISOString().split("T")[0];

        let revenueRecord = await Revenue.findOne({ periodType: "daily", periodIdentifier });
        if (!revenueRecord) {
          revenueRecord = new Revenue({
            date: today, periodType: "daily", periodIdentifier,
            productSales: { totalOrders: 0, totalRevenue: 0, totalProfit: 0 },
            summary: { totalRevenue: 0, totalTax: 0, totalCommission: 0, totalPayouts: 0, totalOrders: 0, totalTransactions: 0 }
          });
        }

        // 1. Transaction Ledger entry for the Order (Customer side)
        const mainTxn = new Transaction({
          order: order._id,
          user: order.customer,
          type: "sale",
          amount: order.total,
          tax: order.tax,
          netAmount: order.total - order.tax,
          paymentGateway: { transactionId: transactionId || "N/A", status: "completed" },
          description: `Payment captured for order ${order.orderNumber}`
        });
        await mainTxn.save();

        // 2. Breakdown per Seller
        let totalCommission = 0;
        for (const item of order.items) {
          const seller = await User.findById(item.seller);
          const commissionRate = seller?.sellerInfo?.commissionRate || 10;
          const itemTotal = item.price * item.quantity;
          const commission = itemTotal * (commissionRate / 100);
          const sellerNet = itemTotal - commission;
          totalCommission += commission;

          // Update Seller Balance
          if (seller) {
            seller.balance = (seller.balance || 0) + sellerNet;
            await seller.save();
          }

          // Create Seller Transaction item
          await Transaction.create({
            order: order._id,
            user: item.seller,
            type: "sale",
            amount: itemTotal,
            commission: commission,
            netAmount: sellerNet,
            description: `Item sale: ${item.name} (Qty: ${item.quantity})`
          });

          // Update Seller Metrics in Revenue Record
          const sellerIndex = revenueRecord.sellerMetrics.findIndex(sm => sm.seller?.toString() === item.seller.toString());
          if (sellerIndex === -1) {
            revenueRecord.sellerMetrics.push({
              seller: item.seller,
              name: seller?.name || "Unknown",
              totalSales: item.quantity,
              totalRevenue: itemTotal,
              commission: commission
            });
          } else {
            revenueRecord.sellerMetrics[sellerIndex].totalSales += item.quantity;
            revenueRecord.sellerMetrics[sellerIndex].totalRevenue += itemTotal;
            revenueRecord.sellerMetrics[sellerIndex].commission += commission;
          }
        }

        // 3. Update Global Revenue Record
        revenueRecord.productSales.totalOrders += 1;
        revenueRecord.productSales.totalRevenue += order.total;
        revenueRecord.summary.totalRevenue += order.total;
        revenueRecord.summary.totalTax += order.tax;
        revenueRecord.summary.totalCommission += totalCommission;
        revenueRecord.summary.totalOrders += 1;

        await revenueRecord.save();
      } catch (err) {
        console.error("Financial recording error on payment:", err);
      }
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
      order.customer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Cannot cancel delivered or already cancelled orders
    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${order.status} order`,
      });
    }

    // Customers can only cancel pending orders
    if (req.user.role === "customer" && order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "You can only cancel pending orders. Please contact support.",
      });
    }

    order.status = "cancelled";

    // Handle cancellation financial reversal if it was already paid
    if (order.paymentStatus === "paid") {
      try {
        const Transaction = require("../models/Transaction");
        const User = require("../models/User");

        // Record a reversal transaction for the customer
        const reversalTxn = new Transaction({
          order: order._id,
          user: order.customer,
          type: "refund",
          amount: -order.total,
          tax: -order.tax,
          netAmount: -(order.total - order.tax),
          description: `Order ${order.orderNumber} cancelled by user/admin.`,
        });
        await reversalTxn.save();

        // Update seller balances
        for (const item of order.items) {
          const seller = await User.findById(item.seller);
          if (seller) {
            const commissionRate = seller.sellerInfo?.commissionRate || 10;
            const itemTotal = item.price * item.quantity;
            const commission = itemTotal * (commissionRate / 100);
            const sellerNet = itemTotal - commission;

            seller.balance = (seller.balance || 0) - sellerNet;
            await seller.save();

            // Record seller-specific reversal
            await Transaction.create({
              order: order._id,
              user: item.seller,
              type: "refund",
              amount: -itemTotal,
              commission: -commission,
              netAmount: -sellerNet,
              description: `Reversal for item ${item.name} in cancelled order ${order.orderNumber}`,
            });
          }
        }
      } catch (err) {
        console.error("Cancellation financial reversal error in cancelOrder:", err);
      }
    }
    order.paymentStatus = "refunded";

    // Restore product stock
    for (const item of order.items) {
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
      "items.seller": req.user._id,
    };

    if (status) {
      matchStage.status = status;
    }

    const orders = await Order.find(matchStage)
      .populate("customer", "name email phoneNumber")
      .populate("items.product", "name mainImage")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter order items to show only seller's items
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) =>
          item.seller && item.seller.toString() === req.user._id.toString()
      );
      return orderObj;
    });

    const count = await Order.countDocuments(matchStage);

    res.json({
      success: true,
      data: filteredOrders,
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
    if (status) query.status = status;
    if (user) query.customer = user;
    if (seller) query["items.seller"] = seller;

    const orders = await Order.find(query)
      .populate("customer", "name email")
      .populate("items.product", "name")
      .populate("items.seller", "name sellerInfo.businessName")
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
// @route   GET /api/orders/admin/stats
// @access  Private (Admin/Seller)
exports.getOrderStats = async (req, res) => {
  try {
    const matchStage =
      req.user.role === "seller" ? { "items.seller": req.user._id } : {};

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments(matchStage);
    const totalRevenue = await Order.aggregate([
      { $match: { ...matchStage, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
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
