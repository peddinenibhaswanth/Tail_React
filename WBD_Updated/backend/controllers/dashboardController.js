const User = require("../models/User");
const Pet = require("../models/Pet");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Appointment = require("../models/Appointment");
const AdoptionApplication = require("../models/AdoptionApplication");
const Revenue = require("../models/Revenue");
const Message = require("../models/Message");

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
    const pendingOrganizations = await User.countDocuments({
      role: "organization",
      isApproved: false,
    });
    const pendingCoAdmins = await User.countDocuments({
      role: "co-admin",
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

    // Veterinary appointment revenue for admin
    const appointmentRevenueData = await Appointment.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$consultationFee" },
          count: { $sum: 1 },
        },
      },
    ]);

    const appointmentRevenue = appointmentRevenueData[0]?.totalRevenue || 0;
    const paidAppointments = appointmentRevenueData[0]?.count || 0;

    // Per-vet revenue breakdown
    const vetRevenueBreakdown = await Appointment.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$veterinary",
          totalRevenue: { $sum: "$consultationFee" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "vetUser",
        },
      },
      { $unwind: { path: "$vetUser", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vetId: "$_id",
          name: "$vetUser.name",
          email: "$vetUser.email",
          commissionRate: { $ifNull: ["$vetUser.vetInfo.commissionRate", 10] },
          totalRevenue: 1,
          count: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Calculate appointment commission for the platform
    const appointmentCommission = vetRevenueBreakdown.reduce((sum, v) => {
      return sum + (v.totalRevenue * (v.commissionRate / 100));
    }, 0);

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

    // Unread messages count
    const unreadMessages = await Message.countDocuments({ status: "unread" });

    // Time-series chart data (bucketed by day or month based on period)
    const groupFormat = days >= 365 ? "%Y-%m" : "%Y-%m-%d";
    const groupDateExpr = { $dateToString: { format: groupFormat, date: "$createdAt" } };

    const newUsersTrend = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: groupDateExpr, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const ordersTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: groupDateExpr, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const orderRevenueTrend = await Order.aggregate([
      { $match: { status: "delivered", createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupDateExpr,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const appointmentRevenueTrend = await Appointment.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          revenue: { $sum: "$consultationFee" },
          appointments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge order and appointment revenue trends
    const revenueTrendMap = new Map();
    
    orderRevenueTrend.forEach((item) => {
      revenueTrendMap.set(item._id, {
        _id: item._id,
        revenue: item.revenue || 0,
        orders: item.orders || 0,
        appointments: 0,
        orderRevenue: item.revenue || 0,
        appointmentRevenue: 0,
      });
    });

    appointmentRevenueTrend.forEach((item) => {
      const existing = revenueTrendMap.get(item._id);
      if (existing) {
        existing.revenue += item.revenue || 0;
        existing.appointments = item.appointments || 0;
        existing.appointmentRevenue = item.revenue || 0;
      } else {
        revenueTrendMap.set(item._id, {
          _id: item._id,
          revenue: item.revenue || 0,
          orders: 0,
          appointments: item.appointments || 0,
          orderRevenue: 0,
          appointmentRevenue: item.revenue || 0,
        });
      }
    });

    const revenueTrend = Array.from(revenueTrendMap.values()).sort((a, b) => 
      a._id.localeCompare(b._id)
    );

    const petsTrend = await Pet.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: groupDateExpr, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

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
          organizations: pendingOrganizations,
          coAdmins: pendingCoAdmins,
        },
        revenue: {
          gmv: gmv,
          productSales: productRevenue,
          platformCommission: platformCommission,
          taxCollected: taxCollected,
          shippingRevenue: shippingRevenue,
          netPlatformRevenue: netPlatformRevenue,
          appointmentRevenue: appointmentRevenue,
          appointmentCommission: appointmentCommission,
          paidAppointments: paidAppointments,
          totalPlatformRevenue: netPlatformRevenue + appointmentCommission,
          period: `Last ${days} days`,
        },
        vetRevenueBreakdown,
        unreadMessages,
        recentActivity,
        charts: {
          newUsersTrend,
          ordersTrend,
          revenueTrend,
          petsTrend,
        },
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
    let pendingRevenue = 0;
    const ordersByStatus = {};
    const ACTIVE_STATUSES = ["pending", "processing", "shipped"];

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

      // Count only delivered orders for confirmed revenue
      if (order.status === "delivered") {
        deliveredRevenue += sellerItemsRevenue;
      }

      // Pending revenue = only active (not yet delivered, not cancelled/refunded)
      if (ACTIVE_STATUSES.includes(order.status)) {
        pendingRevenue += sellerItemsRevenue;
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
          pendingRevenue: pendingRevenue, // Revenue from active orders only (pending/processing/shipped)
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

    // Revenue from appointments
    const revenue = await Appointment.aggregate([
      {
        $match: {
          veterinary: vetId,
          paymentStatus: "paid",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$consultationFee" },
          count: { $sum: 1 },
        },
      },
    ]);

    // All-time revenue for balance context
    const allTimeRevenue = await Appointment.aggregate([
      {
        $match: {
          veterinary: vetId,
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$consultationFee" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get vet's commission rate and balance
    const vetUser = await User.findById(vetId).select("vetInfo balance");
    const commissionRate = vetUser?.vetInfo?.commissionRate || 10;

    const totalRevenue = revenue[0]?.total || 0;
    const completedCount = revenue[0]?.count || 0;
    const allTimeTotalRevenue = allTimeRevenue[0]?.total || 0;
    const allTimePaidCount = allTimeRevenue[0]?.count || 0;
    const periodCommission = totalRevenue * (commissionRate / 100);
    const periodNetEarnings = totalRevenue - periodCommission;
    const allTimeCommission = allTimeTotalRevenue * (commissionRate / 100);
    const allTimeNetEarnings = allTimeTotalRevenue - allTimeCommission;

    // Revenue trend
    const revenueTrend = await Appointment.aggregate([
      {
        $match: {
          veterinary: vetId,
          paymentStatus: "paid",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$consultationFee" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pending payments (confirmed/in-progress but not paid)
    const pendingPayments = await Appointment.aggregate([
      {
        $match: {
          veterinary: vetId,
          paymentStatus: "pending",
          status: { $nin: ["cancelled", "no-show"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$consultationFee" },
          count: { $sum: 1 },
        },
      },
    ]);

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
          commissionRate,
          commissionAmount: periodCommission,
          netEarnings: periodNetEarnings,
          paidAppointments: completedCount,
          pendingPayments: pendingPayments[0]?.total || 0,
          pendingPaymentCount: pendingPayments[0]?.count || 0,
          allTime: {
            totalRevenue: allTimeTotalRevenue,
            commission: allTimeCommission,
            netEarnings: allTimeNetEarnings,
            paidAppointments: allTimePaidCount,
          },
          currentBalance: vetUser?.balance || 0,
          period: `Last ${days} days`,
        },
        revenueTrend,
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
