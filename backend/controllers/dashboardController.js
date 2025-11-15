const User = require("../models/User");
const Pet = require("../models/Pet");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Appointment = require("../models/Appointment");
const AdoptionApplication = require("../models/AdoptionApplication");
const Revenue = require("../models/Revenue");

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate },
    });
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // Pending approvals
    const pendingUsers = await User.countDocuments({ status: "pending" });
    const pendingApplications = await AdoptionApplication.countDocuments({
      status: "pending",
    });
    const pendingSellers = await User.countDocuments({
      role: "seller",
      isApproved: false,
    });
    const pendingVeterinarians = await User.countDocuments({
      role: "veterinary",
      isApproved: false,
    });

    // Pet statistics
    const totalPets = await Pet.countDocuments();
    const availablePets = await Pet.countDocuments({
      status: "available",
    });
    const adoptedPets = await Pet.countDocuments({ status: "adopted" });
    const petsByType = await Pet.aggregate([
      { $group: { _id: "$species", count: { $sum: 1 } } },
    ]);

    // Product statistics
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 10 },
    });

    // Order statistics
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: startDate },
    });
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Revenue statistics - Professional breakdown like Amazon/Flipkart
    // Get all delivered orders for accurate revenue calculation
    const deliveredOrdersData = await Order.find({
      status: "delivered",
      createdAt: { $gte: startDate },
    });

    // Calculate professional revenue breakdown
    let gmv = 0; // Gross Merchandise Value (total customer paid)
    let productRevenue = 0; // Just product prices
    let taxCollected = 0; // Tax collected from customers
    let shippingRevenue = 0; // Shipping fees collected
    let platformCommission = 0; // 10% commission from sellers

    for (const order of deliveredOrdersData) {
      gmv += order.total || 0;
      const orderSubtotal = order.subtotal || 0;
      productRevenue += orderSubtotal;
      taxCollected += order.tax || 0;
      shippingRevenue += order.shipping || 0;
      platformCommission += orderSubtotal * 0.1; // 10% platform commission
    }

    const deliveredOrders = deliveredOrdersData.length;
    const netPlatformRevenue = platformCommission + shippingRevenue; // Platform actually keeps this

    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const upcomingAppointments = await Appointment.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    });

    // Recent activity (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentActivity = {
      newUsers: await User.countDocuments({ createdAt: { $gte: last7Days } }),
      newPets: await Pet.countDocuments({ createdAt: { $gte: last7Days } }),
      newOrders: await Order.countDocuments({ createdAt: { $gte: last7Days } }),
      newApplications: await AdoptionApplication.countDocuments({
        createdAt: { $gte: last7Days },
      }),
    };

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          new: newUsers,
          pending: pendingUsers,
          byRole: usersByRole,
        },
        pets: {
          total: totalPets,
          available: availablePets,
          adopted: adoptedPets,
          byType: petsByType,
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
        },
        orders: {
          total: totalOrders,
          recent: recentOrders,
          delivered: deliveredOrders,
          byStatus: ordersByStatus,
        },
        appointments: {
          total: totalAppointments,
          upcoming: upcomingAppointments,
        },
        applications: {
          pending: pendingApplications,
        },
        pendingApprovals: {
          sellers: pendingSellers,
          veterinarians: pendingVeterinarians,
        },
        revenue: {
          // Professional breakdown like Amazon Seller Central / Flipkart
          gmv: gmv, // Total amount customers paid
          productSales: productRevenue, // Product prices only
          platformCommission: platformCommission, // 10% from sellers
          taxCollected: taxCollected, // GST collected (liability)
          shippingRevenue: shippingRevenue, // Shipping fees
          netPlatformRevenue: netPlatformRevenue, // Commission + Shipping (actual platform earnings)
          period: `Last ${days} days`,
        },
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching admin dashboard",
      error: error.message,
    });
  }
};

// @desc    Get seller dashboard statistics
// @route   GET /api/dashboard/seller
// @access  Private (Seller)
exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Define last7Days early to avoid reference error
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    // Product statistics
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const activeProducts = await Product.countDocuments({
      seller: sellerId,
      stock: { $gt: 0 },
    });
    const lowStockProducts = await Product.countDocuments({
      seller: sellerId,
      stock: { $lt: 10, $gt: 0 },
    });
    const outOfStockProducts = await Product.countDocuments({
      seller: sellerId,
      stock: 0,
    });

    // Order statistics (seller's products)
    // Get all orders containing seller's items
    const ordersWithSellerItems = await Order.find({
      "items.seller": sellerId,
    }).lean();

    // Calculate statistics
    let totalOrders = 0;
    let totalRevenue = 0;
    let deliveredRevenue = 0;
    const ordersByStatus = {};

    const processedOrderIds = new Set();

    for (const order of ordersWithSellerItems) {
      // Only count unique orders
      if (!processedOrderIds.has(order._id.toString())) {
        processedOrderIds.add(order._id.toString());
        totalOrders++;

        // Initialize status count
        if (!ordersByStatus[order.status]) {
          ordersByStatus[order.status] = { count: 0, revenue: 0 };
        }
        ordersByStatus[order.status].count++;
      }

      // Calculate revenue from seller's items only
      const sellerItemsRevenue = order.items
        .filter((item) => item.seller.toString() === sellerId.toString())
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      totalRevenue += sellerItemsRevenue;
      ordersByStatus[order.status].revenue += sellerItemsRevenue;

      // Count only delivered orders for revenue
      if (order.status === "delivered") {
        deliveredRevenue += sellerItemsRevenue;
      }
    }

    // Format ordersByStatus for response
    const sellerOrders = Object.keys(ordersByStatus).map((status) => ({
      _id: status,
      count: ordersByStatus[status].count,
      revenue: ordersByStatus[status].revenue,
    }));

    // Recent orders
    const recentOrders = await Order.countDocuments({
      "items.seller": sellerId,
      createdAt: { $gte: startDate },
    });

    // Pending orders requiring action
    const pendingOrders = await Order.countDocuments({
      "items.seller": sellerId,
      status: { $in: ["pending", "processing"] },
    });

    // Product performance
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.seller": sellerId } },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    // Revenue trend (last 7 days)
    const revenueTrend = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.seller": sellerId,
          createdAt: { $gte: last7Days },
          status: "delivered",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        orders: {
          total: totalOrders,
          recent: recentOrders,
          pending: pendingOrders,
          byStatus: sellerOrders,
        },
        revenue: {
          // Professional breakdown like Amazon/Flipkart Seller Hub
          grossSales: deliveredRevenue, // Total product sales (before commission)
          commissionDeducted: deliveredRevenue * 0.1, // 10% platform fee
          netEarnings: deliveredRevenue * 0.9, // What seller actually receives
          pendingRevenue: totalRevenue - deliveredRevenue, // Revenue from non-delivered orders
          period: `Last ${days} days`,
        },
        topProducts,
        revenueTrend,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller dashboard",
      error: error.message,
    });
  }
};

// @desc    Get veterinary dashboard statistics
// @route   GET /api/dashboard/veterinary
// @access  Private (Veterinary)
exports.getVeterinaryDashboard = async (req, res) => {
  try {
    const vetId = req.user._id;
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments({
      veterinary: vetId,
    });
    const upcomingAppointments = await Appointment.countDocuments({
      veterinary: vetId,
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    });
    const completedAppointments = await Appointment.countDocuments({
      veterinary: vetId,
      status: "completed",
    });
    const todayAppointments = await Appointment.countDocuments({
      veterinary: vetId,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
      status: { $in: ["scheduled", "confirmed"] },
    });

    // Appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: { veterinary: vetId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Recent appointments
    const recentAppointments = await Appointment.countDocuments({
      veterinary: vetId,
      createdAt: { $gte: startDate },
    });

    // Appointments by service type
    const appointmentsByService = await Appointment.aggregate([
      { $match: { veterinary: vetId } },
      { $group: { _id: "$serviceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Schedule for next 7 days
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const upcomingSchedule = await Appointment.aggregate([
      {
        $match: {
          veterinary: vetId,
          date: { $gte: new Date(), $lte: next7Days },
          status: { $in: ["scheduled", "confirmed"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue from appointments (if tracking)
    const revenue = await Appointment.aggregate([
      {
        $match: {
          veterinary: vetId,
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$fee" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenue[0]?.total || 0;
    const completedCount = revenue[0]?.count || 0;

    res.json({
      success: true,
      data: {
        appointments: {
          total: totalAppointments,
          upcoming: upcomingAppointments,
          today: todayAppointments,
          completed: completedAppointments,
          recent: recentAppointments,
          byStatus: appointmentsByStatus,
          byService: appointmentsByService,
        },
        schedule: {
          next7Days: upcomingSchedule,
        },
        revenue: {
          total: totalRevenue,
          completedAppointments: completedCount,
          period: `Last ${days} days`,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching veterinary dashboard",
      error: error.message,
    });
  }
};

// @desc    Get customer dashboard statistics
// @route   GET /api/dashboard/customer
// @access  Private (Customer)
exports.getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Orders
    const totalOrders = await Order.countDocuments({ customer: userId });
    const activeOrders = await Order.countDocuments({
      customer: userId,
      status: { $in: ["pending", "processing", "shipped"] },
    });
    const completedOrders = await Order.countDocuments({
      customer: userId,
      status: "delivered",
    });

    // Appointments
    const totalAppointments = await Appointment.countDocuments({
      user: userId,
    });
    const upcomingAppointments = await Appointment.countDocuments({
      user: userId,
      date: { $gte: new Date() },
      status: { $in: ["pending", "scheduled", "confirmed"] },
    });

    // Adoption applications
    const totalApplications = await AdoptionApplication.countDocuments({
      applicant: userId,
    });
    const pendingApplications = await AdoptionApplication.countDocuments({
      applicant: userId,
      status: "pending",
    });
    const approvedApplications = await AdoptionApplication.countDocuments({
      applicant: userId,
      status: "approved",
    });

    // Recent activity
    const recentOrders = await Order.find({ customer: userId })
      .populate("items.product", "name mainImage")
      .sort("-createdAt")
      .limit(5)
      .lean();

    const recentAppointments = await Appointment.find({ user: userId })
      .populate("veterinary", "name vetInfo")
      .populate("pet", "name")
      .sort("-date")
      .limit(3)
      .lean();

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          active: activeOrders,
          completed: completedOrders,
        },
        appointments: {
          total: totalAppointments,
          upcoming: upcomingAppointments,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
        },
        recentActivity: {
          orders: recentOrders,
          appointments: recentAppointments,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customer dashboard",
      error: error.message,
    });
  }
};
