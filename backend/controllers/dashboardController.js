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

    // Pet statistics
    const totalPets = await Pet.countDocuments();
    const availablePets = await Pet.countDocuments({
      adoptionStatus: "available",
    });
    const adoptedPets = await Pet.countDocuments({ adoptionStatus: "adopted" });
    const petsByType = await Pet.aggregate([
      { $group: { _id: "$petType", count: { $sum: 1 } } },
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
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    // Revenue statistics
    const revenueData = await Order.aggregate([
      { $match: { orderStatus: "delivered", createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const deliveredOrders = revenueData[0]?.orderCount || 0;

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
        revenue: {
          total: totalRevenue,
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
    const sellerOrders = await Order.aggregate([
      { $unwind: "$orderItems" },
      { $match: { "orderItems.seller": sellerId } },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          revenue: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
          },
        },
      },
    ]);

    const totalOrders = sellerOrders.reduce((acc, curr) => acc + curr.count, 0);
    const totalRevenue = sellerOrders.reduce(
      (acc, curr) => acc + curr.revenue,
      0
    );

    // Recent orders
    const recentOrders = await Order.countDocuments({
      "orderItems.seller": sellerId,
      createdAt: { $gte: startDate },
    });

    // Pending orders requiring action
    const pendingOrders = await Order.countDocuments({
      "orderItems.seller": sellerId,
      orderStatus: { $in: ["pending", "processing"] },
    });

    // Product performance
    const topProducts = await Order.aggregate([
      { $unwind: "$orderItems" },
      { $match: { "orderItems.seller": sellerId } },
      {
        $group: {
          _id: "$orderItems.product",
          name: { $first: "$orderItems.name" },
          totalSold: { $sum: "$orderItems.quantity" },
          revenue: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    // Revenue trend (last 7 days)
    const revenueTrend = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.seller": sellerId,
          createdAt: { $gte: last7Days },
          orderStatus: "delivered",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

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
          total: totalRevenue,
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
    const totalOrders = await Order.countDocuments({ user: userId });
    const activeOrders = await Order.countDocuments({
      user: userId,
      orderStatus: { $in: ["pending", "processing", "shipped"] },
    });
    const completedOrders = await Order.countDocuments({
      user: userId,
      orderStatus: "delivered",
    });

    // Appointments
    const totalAppointments = await Appointment.countDocuments({
      user: userId,
    });
    const upcomingAppointments = await Appointment.countDocuments({
      user: userId,
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
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
    const recentOrders = await Order.find({ user: userId })
      .populate("orderItems.product", "name mainImage")
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
