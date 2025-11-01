const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pet = require("../models/Pet");
const Product = require("../models/Product");
const AdoptionApplication = require("../models/AdoptionApplication");
const Message = require("../models/Message");
const {
  isAuthenticated,
  isAdminOrCoAdmin,
  isAdmin,
} = require("../middleware/auth");

// User management routes
router.get("/users", isAuthenticated, isAdminOrCoAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
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
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
  }
});

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
      res
        .status(500)
        .json({
          success: false,
          message: "Error fetching user",
          error: error.message,
        });
    }
  }
);

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
      res
        .status(400)
        .json({
          success: false,
          message: "Error updating user status",
          error: error.message,
        });
    }
  }
);

router.delete("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting user",
        error: error.message,
      });
  }
});

// Adoption applications management
router.get(
  "/applications",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const query = status ? { status } : {};

      const applications = await AdoptionApplication.find(query)
        .populate("applicant", "name email phoneNumber")
        .populate("pet", "name petType breed")
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
      res
        .status(500)
        .json({
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
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const application = await AdoptionApplication.findById(req.params.id)
        .populate("applicant", "name email phoneNumber address")
        .populate("pet", "name petType breed age");

      if (!application) {
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
      }

      res.json({ success: true, data: application });
    } catch (error) {
      res
        .status(500)
        .json({
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
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const updateData = { status };

      if (status === "rejected" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const application = await AdoptionApplication.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!application) {
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
      }

      // If approved, update pet adoption status
      if (status === "approved") {
        await Pet.findByIdAndUpdate(application.pet, {
          adoptionStatus: "adopted",
        });
      }

      res.json({
        success: true,
        message: "Application status updated",
        data: application,
      });
    } catch (error) {
      res
        .status(400)
        .json({
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
      .populate("user", "name email")
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
    res
      .status(500)
      .json({
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
      res
        .status(500)
        .json({
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
      res
        .status(400)
        .json({
          success: false,
          message: "Error updating message",
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
        pets: await Pet.countDocuments(),
        products: await Product.countDocuments(),
        pendingApplications: await AdoptionApplication.countDocuments({
          status: "pending",
        }),
        unreadMessages: await Message.countDocuments({ status: "unread" }),
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Error fetching statistics",
          error: error.message,
        });
    }
  }
);

module.exports = router;
