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

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      }).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
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

// Approve seller/veterinary account
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

      if (!["seller", "veterinary"].includes(user.role)) {
        return res.status(400).json({
          success: false,
          message: "Only seller and veterinary accounts can be approved",
        });
      }

      user.isApproved = true;
      await user.save();

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

// Update user role (admin only)
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

    user.role = role;
    // If changing to seller or veterinary, set isApproved to true
    if (["seller", "veterinary"].includes(role)) {
      user.isApproved = true;
    }
    await user.save();

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

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

// Co-admin management (admin only)
router.get("/co-admins", isAuthenticated, isAdmin, async (req, res) => {
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

router.post("/co-admins", isAuthenticated, isAdmin, async (req, res) => {
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

router.delete("/co-admins/:id", isAuthenticated, isAdmin, async (req, res) => {
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
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const query = status ? { status } : {};

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
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const application = await AdoptionApplication.findById(req.params.id)
        .populate("applicant", "name email phone address")
        .populate("pet", "name species breed age mainImage status");

      if (!application) {
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
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
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { status, rejectionReason, notes } = req.body;
      const updateData = { status };

      if (status === "rejected" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      if (notes) {
        updateData.adminNotes = notes;
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

      // If approved, update pet status to adopted
      if (status === "approved") {
        await Pet.findByIdAndUpdate(application.pet, {
          status: "adopted",
        });

        // Record revenue for this adoption
        try {
          const Transaction = require("../models/Transaction");
          const Revenue = require("../models/Revenue");
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const periodIdentifier = today.toISOString().split("T")[0];

          let revenueRecord = await Revenue.findOne({ periodType: "daily", periodIdentifier });
          if (!revenueRecord) {
            revenueRecord = new Revenue({
              date: today, periodType: "daily", periodIdentifier,
              summary: { totalRevenue: 0, totalTax: 0, totalCommission: 0, totalPayouts: 0, totalOrders: 0, totalTransactions: 0 }
            });
          }

          const adoptionFee = application.adoptionFee || 0;

          // 1. Transaction Ledger entry for the Adoption
          await Transaction.create({
            adoption: application._id,
            user: application.customer,
            type: "sale",
            amount: adoptionFee,
            netAmount: adoptionFee,
            description: `Pet adoption approved: ${application.petName || "Pet"}`
          });

          // 2. Update Global Revenue Record
          revenueRecord.adoptions.totalAdoptions += 1;
          revenueRecord.adoptions.totalRevenue += adoptionFee;
          revenueRecord.summary.totalRevenue += adoptionFee;
          revenueRecord.summary.totalTransactions += 1;

          // Update by species
          const petDoc = await Pet.findById(application.pet);
          if (petDoc) {
            const speciesIndex = revenueRecord.adoptions.bySpecies.findIndex(
              (s) => s.species.toLowerCase() === petDoc.species.toLowerCase()
            );

            if (speciesIndex === -1) {
              revenueRecord.adoptions.bySpecies.push({
                species: petDoc.species,
                count: 1,
                revenue: adoptionFee,
              });
            } else {
              revenueRecord.adoptions.bySpecies[speciesIndex].count += 1;
              revenueRecord.adoptions.bySpecies[speciesIndex].revenue += adoptionFee;
            }
          }

          await revenueRecord.save();
        } catch (revErr) {
          console.error("Adoption revenue recording error:", revErr);
        }
      }
      // If rejected, set pet back to available
      if (status === "rejected") {
        await Pet.findByIdAndUpdate(application.pet, {
          status: "available",
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
