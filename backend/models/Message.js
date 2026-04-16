const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Sender information
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Recipient information (null for general contact messages)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Message type
    messageType: {
      type: String,
      enum: [
        "contact",
        "inquiry",
        "support",
        "adoption",
        "product",
        "appointment",
        "admin",
      ],
      default: "contact",
    },

    // Subject
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Message body
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Related entity references
    relatedTo: {
      entityType: {
        type: String,
        enum: ["pet", "product", "order", "appointment", "application", "none"],
        default: "none",
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    // Contact information for non-authenticated users
    contactInfo: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },

    // Message status
    status: {
      type: String,
      enum: ["unread", "read", "replied", "resolved", "archived"],
      default: "unread",
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Read status
    readAt: Date,

    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Reply information
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],

    // Response
    response: {
      text: {
        type: String,
        trim: true,
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      respondedAt: Date,
    },

    // Attachments
    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
      },
    ],

    // Tags for categorization
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Admin notes (internal)
    adminNotes: {
      type: String,
      trim: true,
    },

    // Assigned to (for ticket management)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // IP address for spam prevention
    ipAddress: {
      type: String,
    },

    // Spam flag
    isSpam: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ sender: 1, status: 1 });
messageSchema.index({ recipient: 1, status: 1 });
messageSchema.index({ status: 1, priority: -1, createdAt: -1 });
messageSchema.index({ messageType: 1, status: 1 });
messageSchema.index({ "relatedTo.entityType": 1, "relatedTo.entityId": 1 });

// Text index for searching
messageSchema.index({ subject: "text", body: "text" });

// Virtual to check if message has been read
messageSchema.virtual("isRead").get(function () {
  return this.status !== "unread";
});

// Virtual to check if message needs attention
messageSchema.virtual("needsAttention").get(function () {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  return this.status === "unread" && this.createdAt < twoDaysAgo;
});

// Method to mark message as read
messageSchema.methods.markAsRead = function (userId) {
  this.status = "read";
  this.readAt = new Date();
  this.readBy = userId;
  return this.save();
};

// Method to add reply reference
messageSchema.methods.addReply = function (replyMessageId) {
  if (!this.replies.includes(replyMessageId)) {
    this.replies.push(replyMessageId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function (userId, isAdmin = false) {
  const query = isAdmin
    ? {
        status: "unread",
        messageType: { $in: ["contact", "inquiry", "support"] },
      }
    : { recipient: userId, status: "unread" };

  return this.countDocuments(query);
};

// Auto-populate sender and recipient in queries
messageSchema.pre(/^find/, function (next) {
  this.populate("sender", "name email role")
    .populate("recipient", "name email role")
    .populate("assignedTo", "name email");
  next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
