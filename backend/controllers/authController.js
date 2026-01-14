const User = require("../models/User");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// JWT Secret and Expiry from environment or defaults
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // Token valid for 7 days

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      password2,
      role,
      phone,
      address,
      sellerInfo,
      vetInfo,
    } = req.body;

    if (!name || !email || !password || !password2) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    if (password !== password2) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      role: role || "customer",
      phone,
      address,
    };

    if (role === "seller" && sellerInfo) {
      userData.sellerInfo = sellerInfo;
    }

    if (role === "veterinary" && vetInfo) {
      userData.vetInfo = vetInfo;
    }

    const newUser = new User(userData);
    await newUser.save();

    // Generate JWT token for the new user
    const token = generateToken(newUser._id);

    // Return user data and token (no session needed)
    return res.status(201).json({
      success: true,
      message:
        role === "customer"
          ? "Registration successful"
          : "Registration successful. Your account is pending approval.",
      user: newUser,
      token: token, // JWT token for authentication
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No user found with that email",
      });
    }

    // Check if seller/veterinary is approved
    if (
      (user.role === "seller" || user.role === "veterinary") &&
      !user.isApproved
    ) {
      return res.status(401).json({
        success: false,
        message: "Your account is pending approval. Please wait for admin approval.",
      });
    }

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    const userResponse = user.toJSON(); // This removes password due to schema method

    return res.json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token: token, // JWT token for authentication
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

exports.logout = (req, res) => {
  // With JWT, logout is handled on the client side by removing the token
  // Server just acknowledges the logout request
  return res.json({
    success: true,
    message: "Logout successful",
  });
};

exports.getCurrentUser = (req, res) => {
  // req.user is set by JWT middleware if token is valid
  if (req.user) {
    return res.json({
      success: true,
      user: req.user,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Not authenticated",
  });
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, sellerInfo, vetInfo } = req.body;

    const updateData = {
      name,
      phone,
      address,
      updatedAt: Date.now(),
    };

    if (req.user.role === "seller" && sellerInfo) {
      updateData.sellerInfo = sellerInfo;
    }

    if (req.user.role === "veterinary" && vetInfo) {
      updateData.vetInfo = vetInfo;
    }

    if (req.file) {
      updateData.profileImage = `/uploads/users/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId);

    // With JWT, just confirm deletion - client will remove token
    return res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting account",
      error: error.message,
    });
  }
};
