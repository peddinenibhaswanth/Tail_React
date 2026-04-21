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
    const totalPets = await Pet.countDocuments({
      status: "available",
    });
    const availablePets = await Pet.countDocuments({
      status: "available",
    });
    const adoptedPets = await Pet.countDocuments({ status: "adopted" });
    const petsByType = await Pet.aggregate([
      { $match: { status: "available" } },
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

    const deliveredOrdersData = await Order.find({
      status: "delivered",
      createdAt: { $gte: startDate },
    });

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
      platformCommission += orderSubtotal * 0.1; 
    }

    const deliveredOrders = deliveredOrdersData.length;
    // Platform actually keeps: seller commission + shipping. (Appointment commission is added below.)
    let netPlatformRevenue = platformCommission + shippingRevenue;

    // Appointment revenue (gross) + platform commission from vet appointments
    const appointmentRevenueByDay = await Appointment.aggregate([
      {
        $addFields: {
          trendDate: { $ifNull: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $match: {
          paymentStatus: "paid",
          status: "completed",
          trendDate: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "veterinary",
          foreignField: "_id",
          as: "vetDetails",
        },
      },
      { $unwind: { path: "$vetDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          commissionRate: {
            $ifNull: ["$vetDetails.vetInfo.commissionRate", 10],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$trendDate" },
          },
          revenue: { $sum: "$consultationFee" },
          commission: {
            $sum: {
              $multiply: [
                "$consultationFee",
                { $divide: ["$commissionRate", 100] },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    let appointmentRevenue = 0;
    let appointmentCommission = 0;
    let paidAppointments = 0;
    for (const row of appointmentRevenueByDay) {
      appointmentRevenue += row.revenue || 0;
      appointmentCommission += row.commission || 0;
      paidAppointments += row.count || 0;
    }

    const totalPlatformRevenue = platformCommission + appointmentCommission;
    netPlatformRevenue = netPlatformRevenue + appointmentCommission;

    // Revenue trend chart: platform revenue = order commission + appointment commission.
    // Build from deliveredOrdersData to keep it consistent with platformCommission calculation.
    const trendMap = new Map();
    for (const order of deliveredOrdersData) {
      const date = order.createdAt || order.updatedAt;
      if (!date) continue;
      const dayKey = new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
      const orderRevenue = (order.subtotal || 0) * 0.1;
      const existing = trendMap.get(dayKey);
      if (!existing) {
        trendMap.set(dayKey, {
          _id: dayKey,
          orderRevenue,
          appointmentRevenue: 0,
          revenue: orderRevenue,
        });
      } else {
        existing.orderRevenue = (existing.orderRevenue || 0) + orderRevenue;
        existing.revenue =
          (existing.orderRevenue || 0) + (existing.appointmentRevenue || 0);
      }
    }
    for (const row of appointmentRevenueByDay) {
      const appointmentRevenueForChart = row.commission || 0;
      const existing = trendMap.get(row._id);
      if (!existing) {
        trendMap.set(row._id, {
          _id: row._id,
          orderRevenue: 0,
          appointmentRevenue: appointmentRevenueForChart,
          revenue: appointmentRevenueForChart,
        });
      } else {
        existing.appointmentRevenue = appointmentRevenueForChart;
        existing.revenue =
          (existing.orderRevenue || 0) + (existing.appointmentRevenue || 0);
      }
    }
    const revenueTrend = Array.from(trendMap.values()).sort((a, b) =>
      String(a._id).localeCompare(String(b._id))
    );

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
          gmv: gmv, 
          productSales: productRevenue, 
          platformCommission: platformCommission, 
          taxCollected: taxCollected, 
          shippingRevenue: shippingRevenue, 
          netPlatformRevenue: netPlatformRevenue, 
          appointmentRevenue: appointmentRevenue,
          appointmentCommission: appointmentCommission,
          paidAppointments: paidAppointments,
          totalPlatformRevenue: totalPlatformRevenue,
          period: `Last ${days} days`,
        },
        charts: {
          revenueTrend,
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
    let pendingRevenue = 0; // Revenue from orders awaiting delivery
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

      // Count pending revenue from orders awaiting delivery (pending, processing, shipped)
      if (["pending", "processing", "shipped"].includes(order.status)) {
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
          grossSales: deliveredRevenue, 
          commissionDeducted: deliveredRevenue * 0.1,
          netEarnings: deliveredRevenue * 0.9, 
          pendingRevenue: pendingRevenue,
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

    const Transaction = require("../models/Transaction");

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

    // Revenue is recorded via ledger transactions when appointments are completed.
    const vet = await User.findById(vetId)
      .select("balance vetInfo.commissionRate")
      .lean();

    const commissionRate = vet?.vetInfo?.commissionRate || 10;
    const currentBalance = vet?.balance || 0;

    const periodRevenueAgg = await Transaction.aggregate([
      {
        $match: {
          user: vetId,
          type: "sale",
          appointment: { $ne: null },
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          commissionAmount: { $sum: "$commission" },
          netEarnings: { $sum: "$netAmount" },
          paidAppointments: { $sum: 1 },
        },
      },
    ]);

    const allTimeRevenueAgg = await Transaction.aggregate([
      {
        $match: {
          user: vetId,
          type: "sale",
          appointment: { $ne: null },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          commissionAmount: { $sum: "$commission" },
          netEarnings: { $sum: "$netAmount" },
          paidAppointments: { $sum: 1 },
        },
      },
    ]);

    const pendingPaymentsAgg = await Appointment.aggregate([
      {
        $match: {
          veterinary: vetId,
          paymentStatus: "pending",
          status: { $nin: ["cancelled", "no-show"] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          pendingPayments: { $sum: "$consultationFee" },
          pendingPaymentCount: { $sum: 1 },
        },
      },
    ]);

    const revenueTrend = await Transaction.aggregate([
      {
        $match: {
          user: vetId,
          type: "sale",
          appointment: { $ne: null },
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const periodRev = periodRevenueAgg[0] || {};
    const allTimeRev = allTimeRevenueAgg[0] || {};
    const pendingRev = pendingPaymentsAgg[0] || {};

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
          total: periodRev.totalRevenue || 0,
          commissionRate,
          commissionAmount: periodRev.commissionAmount || 0,
          netEarnings: periodRev.netEarnings || 0,
          paidAppointments: periodRev.paidAppointments || 0,
          pendingPayments: pendingRev.pendingPayments || 0,
          pendingPaymentCount: pendingRev.pendingPaymentCount || 0,
          allTime: {
            totalRevenue: allTimeRev.totalRevenue || 0,
            commission: allTimeRev.commissionAmount || 0,
            netEarnings: allTimeRev.netEarnings || 0,
            paidAppointments: allTimeRev.paidAppointments || 0,
          },
          currentBalance,
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
