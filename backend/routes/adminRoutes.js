const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pet = require("../models/Pet");
const Product = require("../models/Product");
const AdoptionApplication = require("../models/AdoptionApplication");
const Message = require("../models/Message");
const { createNotification } = require("../controllers/notificationController");
const { bumpNamespaceVersion } = require("../services/cacheService");
const {
  isAuthenticated,
  isAdminOrCoAdmin,
  isAdmin,
  isStrictlyAdmin,
  isOrganizationOrAdmin,
} = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations for managing users, applications, and system settings
 */

// User management routes
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: (Admin) Get a list of all users with filtering and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by user status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get("/users", isAuthenticated, isAdminOrCoAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search, approved } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (approved !== undefined && approved !== "") {
      query.isApproved = approved === "true";
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: (Admin) Get a single user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single user object
 *   put:
 *     summary: (Admin) Update a user's details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               isApproved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *   delete:
 *     summary: (Admin) Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.get(
  "/users/:id",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}/details:
 *   get:
 *     summary: (Admin) Get detailed statistics for a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Time period in days (e.g., 30, 90)
 *     responses:
 *       200:
 *         description: Detailed user statistics
 */
router.get(
  "/users/:id/details",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id).select("-password");
      if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const { period = "30" } = req.query;
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const Order = require("../models/Order");
      const Appointment = require("../models/Appointment");

      const details = { type: targetUser.role };

      // ─── SELLER DETAILS ────────────────────────────────────────────────
      if (targetUser.role === "seller") {
        const products = await Product.find({ seller: targetUser._id })
          .select("name price stock category isActive mainImage createdAt")
          .sort("-createdAt")
          .lean();

        const ordersWithItems = await Order.find({ "items.seller": targetUser._id }).lean();

        let totalRevenue = 0;
        let deliveredRevenue = 0;
        const statusCounts = {};

        for (const order of ordersWithItems) {
          const rev = (order.items || [])
            .filter((i) => i.seller?.toString() === targetUser._id.toString())
            .reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
          totalRevenue += rev;
          if (order.status === "delivered") deliveredRevenue += rev;
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        }

        const revenueTrend = await Order.aggregate([
          { $unwind: "$items" },
          {
            $match: {
              "items.seller": targetUser._id,
              createdAt: { $gte: startDate },
              status: "delivered",
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        details.products = products;
        details.revenue = {
          total: totalRevenue,
          delivered: deliveredRevenue,
          pending: totalRevenue - deliveredRevenue,
          netEarnings: Math.round(deliveredRevenue * 0.9),
          commissionPaid: Math.round(deliveredRevenue * 0.1),
        };
        details.orders = {
          total: ordersWithItems.length,
          recentCount: ordersWithItems.filter(
            (o) => new Date(o.createdAt) >= startDate
          ).length,
          byStatus: Object.entries(statusCounts).map(([k, v]) => ({
            status: k,
            count: v,
          })),
        };
        details.revenueTrend = revenueTrend;

        // ─── TOP SELLING PRODUCTS ───────────────────────────────────────
        const topProducts = await Order.aggregate([
          { $unwind: "$items" },
          { $match: { "items.seller": targetUser._id } },
          {
            $group: {
              _id: "$items.product",
              productName: { $first: "$items.name" },
              totalQty: { $sum: "$items.quantity" },
              totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
              orderCount: { $sum: 1 },
            },
          },
          { $sort: { totalQty: -1 } },
          { $limit: 10 },
        ]);

        // Enrich with current product info
        const productIds = topProducts.map((tp) => tp._id).filter(Boolean);
        const productMap = {};
        if (productIds.length > 0) {
          const prods = await Product.find({ _id: { $in: productIds } })
            .select("name price stock category mainImage")
            .lean();
          prods.forEach((p) => { productMap[p._id.toString()] = p; });
        }

        details.topSellingProducts = topProducts.map((tp) => {
          const prod = productMap[tp._id?.toString()] || {};
          return {
            productId: tp._id,
            name: prod.name || tp.productName || "Unknown Product",
            category: prod.category || "—",
            currentPrice: prod.price || 0,
            currentStock: prod.stock ?? "—",
            totalQuantitySold: tp.totalQty,
            totalRevenue: Math.round(tp.totalRevenue),
            orderCount: tp.orderCount,
          };
        });
      }

      // ─── ORGANIZATION DETAILS ───────────────────────────────────────────
      if (targetUser.role === "organization") {
        const pets = await Pet.find({ shelter: targetUser._id })
          .select("name species breed status mainImage createdAt adoptionFee")
          .sort("-createdAt")
          .lean();

        const petIds = pets.map((p) => p._id);
        const applications = await AdoptionApplication.find({ pet: { $in: petIds } })
          .populate("applicant", "name email")
          .populate("pet", "name species mainImage")
          .sort("-createdAt")
          .lean();

        const appStats = { pending: 0, approved: 0, rejected: 0, under_review: 0 };
        applications.forEach((a) => {
          if (a.status in appStats) appStats[a.status]++;
        });

        details.pets = pets;
        details.petStats = {
          total: pets.length,
          available: pets.filter((p) => p.status === "available").length,
          adopted: pets.filter((p) => p.status === "adopted").length,
          pending: pets.filter((p) => p.status === "pending").length,
        };
        details.applications = applications.slice(0, 25);
        details.applicationStats = appStats;
        details.totalApplications = applications.length;
      }

      // ─── VETERINARY DETAILS ─────────────────────────────────────────────
      if (targetUser.role === "veterinary") {
        const Transaction = require("../models/Transaction");

        const appointments = await Appointment.find({ veterinary: targetUser._id })
          .populate("customer", "name email")
          .sort("-createdAt")
          .lean();

        const statusCounts = {};
        const petTypeCounts = {};
        appointments.forEach((a) => {
          statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
          const pt = a.petType || "other";
          petTypeCounts[pt] = (petTypeCounts[pt] || 0) + 1;
        });

        // Revenue from paid appointments (not just completed status)
        const paidAppointments = appointments.filter((a) => a.paymentStatus === "paid");
        const totalFees = paidAppointments.reduce((s, a) => s + (a.consultationFee || 0), 0);
        const commissionRate = targetUser.vetInfo?.commissionRate || 10;
        const totalCommission = totalFees * (commissionRate / 100);
        const netEarnings = totalFees - totalCommission;

        // Pending payments
        const pendingPaymentAppts = appointments.filter(
          (a) => a.paymentStatus === "pending" && !["cancelled", "no-show"].includes(a.status)
        );
        const pendingPaymentTotal = pendingPaymentAppts.reduce((s, a) => s + (a.consultationFee || 0), 0);

        // Transaction history
        const transactions = await Transaction.find({ user: targetUser._id })
          .sort("-createdAt")
          .limit(20)
          .lean();

        const trend = await Appointment.aggregate([
          {
            $match: {
              veterinary: targetUser._id,
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
              revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$consultationFee", 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        details.appointments = appointments.slice(0, 25);
        details.appointmentStats = {
          total: appointments.length,
          recent: appointments.filter((a) => new Date(a.createdAt) >= startDate).length,
          byStatus: Object.entries(statusCounts).map(([k, v]) => ({ status: k, count: v })),
          byPetType: Object.entries(petTypeCounts).map(([k, v]) => ({ type: k, count: v })),
        };
        details.revenue = {
          total: totalFees,
          commissionRate,
          totalCommission,
          netEarnings,
          currentBalance: targetUser.balance || 0,
          paidAppointments: paidAppointments.length,
          pendingPayments: pendingPaymentTotal,
          pendingPaymentCount: pendingPaymentAppts.length,
          avgPerAppointment:
            paidAppointments.length > 0
              ? Math.round(totalFees / paidAppointments.length)
              : 0,
        };
        details.transactions = transactions;
        details.trend = trend;
      }

      // ─── CUSTOMER DETAILS ──────────────────────────────────────────────
      if (targetUser.role === "customer") {
        const AdoptionApplication = require("../models/AdoptionApplication");
        const Review = require("../models/Review");

        // Orders
        const orders = await Order.find({ customer: targetUser._id })
          .sort("-createdAt")
          .lean();

        let totalSpent = 0;
        const orderStatusCounts = {};
        orders.forEach((o) => {
          totalSpent += o.total || 0;
          orderStatusCounts[o.status] = (orderStatusCounts[o.status] || 0) + 1;
        });

        const recentOrders = orders.filter(
          (o) => new Date(o.createdAt) >= startDate
        );

        // Spending trend
        const spendingTrend = await Order.aggregate([
          {
            $match: {
              customer: targetUser._id,
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: days <= 30 ? "%Y-%m-%d" : "%Y-%m",
                  date: "$createdAt",
                },
              },
              spending: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        // Adoption applications
        const applications = await AdoptionApplication.find({ applicant: targetUser._id })
          .populate("pet", "name species mainImage")
          .sort("-createdAt")
          .lean();

        const appStatusCounts = { pending: 0, approved: 0, rejected: 0, under_review: 0 };
        applications.forEach((a) => {
          if (a.status in appStatusCounts) appStatusCounts[a.status]++;
        });

        // Appointments
        const appointments = await Appointment.find({ customer: targetUser._id })
          .populate("veterinary", "name")
          .sort("-createdAt")
          .lean();

        const appointmentStatusCounts = {};
        let totalAppointmentSpent = 0;
        appointments.forEach((a) => {
          appointmentStatusCounts[a.status] = (appointmentStatusCounts[a.status] || 0) + 1;
          if (a.status === "completed") totalAppointmentSpent += a.consultationFee || 0;
        });

        // Reviews
        const reviews = await Review.find({ user: targetUser._id })
          .populate("product", "name")
          .sort("-createdAt")
          .limit(10)
          .lean();

        details.orders = {
          total: orders.length,
          recentCount: recentOrders.length,
          byStatus: Object.entries(orderStatusCounts).map(([k, v]) => ({ status: k, count: v })),
        };
        details.spending = {
          total: totalSpent,
          avgPerOrder: orders.length > 0 ? Math.round(totalSpent / orders.length) : 0,
          recentTotal: recentOrders.reduce((s, o) => s + (o.total || 0), 0),
        };
        details.spendingTrend = spendingTrend;
        details.recentOrders = orders.slice(0, 15);
        details.applications = {
          total: applications.length,
          stats: appStatusCounts,
          recent: applications.slice(0, 10),
        };
        details.appointments = {
          total: appointments.length,
          byStatus: Object.entries(appointmentStatusCounts).map(([k, v]) => ({ status: k, count: v })),
          totalSpent: totalAppointmentSpent,
          recent: appointments.slice(0, 10),
        };
        details.reviews = {
          total: reviews.length,
          items: reviews,
          avgRating: reviews.length > 0 ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0,
        };
      }

      res.json({ success: true, data: { user: targetUser, ...details } });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user details",
        error: error.message,
      });
    }
  }
);

router.put(
  "/users/:id",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { name, email, phone, address, role, isApproved } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (role && req.user.role === "admin") updateData.role = role;
      if (isApproved !== undefined) updateData.isApproved = isApproved;

      const before = await User.findById(req.params.id).select("role isApproved");
      if (!before) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      }).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const roleTouched = before.role === "veterinary" || user.role === "veterinary";
      const changed = before.role !== user.role || before.isApproved !== user.isApproved;
      if (roleTouched && changed) {
        bumpNamespaceVersion("veterinaries").catch(() => {});
      }

      res.json({ success: true, message: "User updated", data: user });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: (Admin) Update a user's status (e.g., active, suspended)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, deleted]
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.patch(
  "/users/:id/status",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.json({ success: true, message: "User status updated", data: user });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error updating user status",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}/approve:
 *   patch:
 *     summary: (Admin) Approve a seller, veterinary, or organization account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User account approved successfully
 */
router.patch(
  "/users/:id/approve",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (!["seller", "veterinary", "organization", "co-admin"].includes(user.role)) {
        return res.status(400).json({
          success: false,
          message: "Only seller, veterinary, organization, and co-admin accounts can be approved",
        });
      }

      // Co-admin approval is restricted to primary admin only
      if (user.role === "co-admin" && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only the primary admin can approve co-admin accounts",
        });
      }

      user.isApproved = true;
      await user.save();

      if (user.role === "veterinary") {
        bumpNamespaceVersion("veterinaries").catch(() => {});
      }

      res.json({
        success: true,
        message: `${user.role} account approved successfully`,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error approving user",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: (Admin) Update a user's role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [customer, seller, veterinary, co-admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.patch("/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["customer", "seller", "veterinary", "co-admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot change admin role",
      });
    }

    const prevRole = user.role;

    user.role = role;
    // If changing to seller, veterinary, or organization, set isApproved to true
    if (["seller", "veterinary", "organization"].includes(role)) {
      user.isApproved = true;
    }
    await user.save();

    if (prevRole === "veterinary" || role === "veterinary") {
      bumpNamespaceVersion("veterinaries").catch(() => {});
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating user role",
      error: error.message,
    });
  }
});

router.delete("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete admin account" });
    }

    // Co-admins cannot delete other co-admins
    if (req.user.role === "co-admin" && user.role === "co-admin") {
      return res
        .status(403)
        .json({ success: false, message: "Co-admins cannot delete other co-admin accounts" });
    }

    await User.findByIdAndDelete(req.params.id);
    if (user.role === "veterinary") {
      bumpNamespaceVersion("veterinaries").catch(() => {});
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/revenue-breakdown:
 *   get:
 *     summary: (Strictly Admin) Get a detailed revenue breakdown for sellers and veterinaries
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Time period in days (e.g., 30, 90)
 *     responses:
 *       200:
 *         description: Detailed revenue breakdown data
 */
router.get("/revenue-breakdown", isAuthenticated, isStrictlyAdmin, async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`[Revenue Breakdown] Period: ${days} days, Start date: ${startDate}`);

    const Order = require("../models/Order");
    const Appointment = require("../models/Appointment");
    const Transaction = require("../models/Transaction");

    // Veterinary Revenue Breakdown
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
          count: { $sum: 1 },
          totalRevenue: { $sum: "$consultationFee" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "vetDetails",
        },
      },
      {
        $unwind: { path: "$vetDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          vetId: "$_id",
          name: { $ifNull: ["$vetDetails.name", "Unknown"] },
          email: { $ifNull: ["$vetDetails.email", ""] },
          count: 1,
          totalRevenue: 1,
          commissionRate: { $ifNull: ["$vetDetails.vetInfo.commissionRate", 10] },
          balance: { $ifNull: ["$vetDetails.balance", 0] },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Seller Revenue Breakdown
    const sellerRevenueBreakdown = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.seller",
          orderCount: { $addToSet: "$_id" },
          productsSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      {
        $unwind: { path: "$sellerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          sellerId: "$_id",
          name: { $ifNull: ["$sellerDetails.name", "Unknown"] },
          email: { $ifNull: ["$sellerDetails.email", ""] },
          orderCount: { $size: "$orderCount" },
          productsSold: 1,
          totalRevenue: 1,
          commissionRate: { $ifNull: ["$sellerDetails.sellerInfo.commissionRate", 10] },
          balance: { $ifNull: ["$sellerDetails.balance", 0] },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    console.log(`[Revenue Breakdown] Vet count: ${vetRevenueBreakdown.length}, Seller count: ${sellerRevenueBreakdown.length}`);

    res.json({
      success: true,
      data: {
        veterinaryBreakdown: vetRevenueBreakdown,
        sellerBreakdown: sellerRevenueBreakdown,
        period: days,
      },
    });
  } catch (error) {
    console.error("[Revenue Breakdown] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue breakdown",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/co-admins:
 *   get:
 *     summary: (Strictly Admin) Get a list of all co-admin accounts
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of co-admins
 *   post:
 *     summary: (Strictly Admin) Create a new co-admin account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Co-admin created successfully
 */
router.get("/co-admins", isAuthenticated, isStrictlyAdmin, async (req, res) => {
  try {
    const coAdmins = await User.find({ role: "co-admin" })
      .select("-password")
      .sort("-createdAt");

    res.json({ success: true, data: coAdmins });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching co-admins",
      error: error.message,
    });
  }
});

router.post("/co-admins", isAuthenticated, isStrictlyAdmin, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const coAdmin = new User({
      name,
      email,
      password,
      phone,
      role: "co-admin",
      isApproved: true,
    });

    await coAdmin.save();

    res.status(201).json({
      success: true,
      message: "Co-admin created successfully",
      data: {
        _id: coAdmin._id,
        name: coAdmin.name,
        email: coAdmin.email,
        role: coAdmin.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating co-admin",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/co-admins/{id}:
 *   delete:
 *     summary: (Strictly Admin) Delete a co-admin account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Co-admin deleted successfully
 */
router.delete("/co-admins/:id", isAuthenticated, isStrictlyAdmin, async (req, res) => {
  try {
    const coAdmin = await User.findOne({
      _id: req.params.id,
      role: "co-admin",
    });

    if (!coAdmin) {
      return res.status(404).json({
        success: false,
        message: "Co-admin not found",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Co-admin deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting co-admin",
      error: error.message,
    });
  }
});

// Adoption applications management
router.get(
  "/applications",
  isAuthenticated,
  isOrganizationOrAdmin,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const query = status ? { status } : {};

      // Organizations can only see applications for their own pets
      if (req.user.role === "organization") {
        const myPets = await Pet.find({ shelter: req.user._id }).select("_id");
        const myPetIds = myPets.map((p) => p._id);
        query.pet = { $in: myPetIds };
      }

      const applications = await AdoptionApplication.find(query)
        .populate("applicant", "name email phone")
        .populate("pet", "name species breed mainImage status")
        .sort("-createdAt")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const count = await AdoptionApplication.countDocuments(query);

      res.json({
        success: true,
        data: applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalApplications: count,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching applications",
        error: error.message,
      });
    }
  }
);

router.get(
  "/applications/:id",
  isAuthenticated,
  isOrganizationOrAdmin,
  async (req, res) => {
    try {
      const application = await AdoptionApplication.findById(req.params.id)
        .populate("applicant", "name email phone address")
        .populate("pet", "name species breed age mainImage status shelter");

      if (!application) {
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
      }

      // Organizations can only view applications for their own pets
      if (
        req.user.role === "organization" &&
        application.pet?.shelter?.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only view applications for your own pets",
        });
      }

      res.json({ success: true, data: application });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching application",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/applications/:id/status",
  isAuthenticated,
  isOrganizationOrAdmin,
  async (req, res) => {
    try {
      const { status, rejectionReason, notes } = req.body;

      // Fetch application first to verify org ownership
      const existingApp = await AdoptionApplication.findById(req.params.id).populate(
        "pet",
        "shelter"
      );

      if (!existingApp) {
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
      }

      // Organizations can only update applications for their own pets
      if (
        req.user.role === "organization" &&
        existingApp.pet?.shelter?.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update applications for your own pets",
        });
      }

      const updateData = { status };

      if (status === "rejected" && (rejectionReason || notes)) {
        updateData.rejectionReason = rejectionReason || notes;
      }
      if (notes) {
        updateData.adminNotes = notes;
      }

      const application = await AdoptionApplication.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      // If approved, update pet status to adopted
      if (status === "approved") {
        await Pet.findByIdAndUpdate(application.pet, { status: "adopted" });
      }
      // If rejected, set pet back to available
      if (status === "rejected") {
        await Pet.findByIdAndUpdate(application.pet, { status: "available" });
      }

      // Notify the applicant about application status change
      const statusMessages = {
        approved: "Congratulations! Your adoption application has been approved!",
        rejected: `Your adoption application has been rejected.${rejectionReason || notes ? " Reason: " + (rejectionReason || notes) : ""}`,
        under_review: "Your adoption application is now under review",
      };
      if (statusMessages[status] && application.applicant) {
        await createNotification({
          recipient: application.applicant,
          type: status === "approved" ? "adoption_approved" : status === "rejected" ? "adoption_rejected" : "adoption_status",
          title: `Adoption Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: statusMessages[status],
          relatedModel: "AdoptionApplication",
          relatedId: application._id,
          link: `/applications`,
        });
      }

      res.json({
        success: true,
        message: "Application status updated",
        data: application,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error updating application",
        error: error.message,
      });
    }
  }
);

// Messages management
router.get("/messages", isAuthenticated, isAdminOrCoAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const messages = await Message.find(query)
      .populate("sender", "name email phone")
      .populate("response.respondedBy", "name")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Message.countDocuments(query);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalMessages: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
});
    
router.get(
  "/messages/:id",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const message = await Message.findById(req.params.id).populate(
        "user",
        "name email phoneNumber"
      );
    
      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }
    
      // Mark as read
      if (message.status === "unread") {
        message.status = "read";
        await message.save();
      }

      res.json({ success: true, data: message });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching message",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/messages/:id/status",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;
      const message = await Message.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      res.json({
        success: true,
        message: "Message status updated",
        data: message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error updating message",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/messages/:id/reply",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { reply } = req.body;
      const message = await Message.findByIdAndUpdate(
        req.params.id,
        {
          reply,
          repliedBy: req.user._id,
          repliedAt: new Date(),
          status: "replied",
        },
        { new: true }
      );

      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      res.json({
        success: true,
        message: "Reply sent successfully",
        data: message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error replying to message",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/messages/:id",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const message = await Message.findByIdAndDelete(req.params.id);

      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting message",
        error: error.message,
      });
    }
  }
);

// Statistics
router.get(
  "/statistics",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const stats = {
        users: await User.countDocuments(),
        pendingUsers: await User.countDocuments({ status: "pending" }),
        pendingSellers: await User.countDocuments({
          role: "seller",
          isApproved: false,
        }),
        pendingVets: await User.countDocuments({
          role: "veterinary",
          isApproved: false,
        }),
        pendingOrganizations: await User.countDocuments({
          role: "organization",
          isApproved: false,
        }),
        pets: await Pet.countDocuments(),
        products: await Product.countDocuments(),
        pendingApplications: await AdoptionApplication.countDocuments({
          status: "pending",
        }),
        unreadMessages: await Message.countDocuments({ status: "unread" }),
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching statistics",
        error: error.message,
      });
    }
  }
);

module.exports = router;
