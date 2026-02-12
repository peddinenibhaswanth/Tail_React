const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const { createNotification } = require("../controllers/notificationController");
const { isAuthenticated, isAdminOrCoAdmin } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management
 */

/**
 * @swagger
 * /api/messages/contact:
 *   post:
 *     summary: Submit a contact message (logged-in user)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [contact, inquiry, support, adoption, product, appointment, admin]
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Subject/message missing
 */
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

    const admins = await User.find(
      { role: { $in: ["admin", "co-admin"] } },
      "_id"
    ).lean();
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        type: "general",
        title: "New Contact Message",
        message: `${req.user.name} sent a message: "${subject}"`,
        relatedModel: null,
        relatedId: newMessage._id,
        link: "/admin/messages",
      });
    }

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

/**
 * @swagger
 * /api/messages/my-messages:
 *   get:
 *     summary: Get the current user's sent messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 */
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

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: Get a single message details (only if you are the sender)
 *     tags: [Messages]
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
 *         description: Message fetched successfully
 *       404:
 *         description: Message not found
 */
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

/**
 * @swagger
 * /api/messages/{id}/reply:
 *   post:
 *     summary: Admin/Co-Admin reply to a message
 *     tags: [Messages]
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
 *             required: [reply]
 *             properties:
 *               reply:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply sent successfully
 *       400:
 *         description: Reply text missing
 *       404:
 *         description: Message not found
 */
router.post("/:id/reply", isAuthenticated, isAdminOrCoAdmin, async (req, res) => {
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

    await message.populate("response.respondedBy", "name");

    if (message.sender) {
      await createNotification({
        recipient: message.sender,
        type: "general",
        title: "Admin Replied to Your Message",
        message: `Your message "${message.subject}" has received a reply from admin`,
        relatedModel: null,
        relatedId: message._id,
        link: "/contact",
      });
    }

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
});

/**
 * @swagger
 * /api/messages/{id}/read:
 *   patch:
 *     summary: Mark message as read (Admin/Co-Admin)
 *     tags: [Messages]
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
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 */
router.patch("/:id/read", isAuthenticated, isAdminOrCoAdmin, async (req, res) => {
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
});

module.exports = router;
