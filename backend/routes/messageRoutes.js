const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { isAuthenticated, isAdminOrCoAdmin } = require("../middleware/auth");

// @desc    Submit a contact message (for logged-in users)
// @route   POST /api/messages/contact
// @access  Private
router.post("/contact", isAuthenticated, async (req, res) => {
  try {
    const { subject, message, messageType = "contact" } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    const newMessage = new Message({
      sender: req.user._id,
      subject,
      body: message,
      messageType,
      status: "unread",
      contactInfo: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || "",
      },
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
});

// @desc    Get user's messages (sent and received replies)
// @route   GET /api/messages/my-messages
// @access  Private
router.get("/my-messages", isAuthenticated, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .sort("-createdAt")
      .select("subject body status response createdAt messageType");

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
});

// @desc    Get single message details
// @route   GET /api/messages/:id
// @access  Private
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id,
    }).populate("response.respondedBy", "name");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching message",
      error: error.message,
    });
  }
});

// @desc    Admin reply to a message
// @route   POST /api/messages/:id/reply
// @access  Admin/Co-Admin
router.post(
  "/:id/reply",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const { reply } = req.body;

      if (!reply) {
        return res.status(400).json({
          success: false,
          message: "Reply text is required",
        });
      }

      const message = await Message.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      message.response = {
        text: reply,
        respondedBy: req.user._id,
        respondedAt: new Date(),
      };
      message.status = "replied";

      await message.save();

      // Populate the respondedBy field for the response
      await message.populate("response.respondedBy", "name");

      res.json({
        success: true,
        message: "Reply sent successfully",
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error sending reply",
        error: error.message,
      });
    }
  }
);

// @desc    Mark message as read by admin
// @route   PATCH /api/messages/:id/read
// @access  Admin/Co-Admin
router.patch(
  "/:id/read",
  isAuthenticated,
  isAdminOrCoAdmin,
  async (req, res) => {
    try {
      const message = await Message.findByIdAndUpdate(
        req.params.id,
        {
          status: "read",
          readAt: new Date(),
          readBy: req.user._id,
        },
        { new: true }
      );

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating message",
        error: error.message,
      });
    }
  }
);

module.exports = router;
