const User = require("../models/User");
const passport = require("passport");

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

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Registration successful but login failed",
        });
      }

      return res.status(201).json({
        success: true,
        message:
          role === "customer"
            ? "Registration successful"
            : "Registration successful. Your account is pending approval.",
        user: newUser,
      });
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

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error during login",
        error: err.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message || "Invalid credentials",
      });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error during login",
          error: err.message,
        });
      }

      return res.json({
        success: true,
        message: "Login successful",
        user: user,
      });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error during logout",
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error destroying session",
        });
      }

      res.clearCookie("connect.sid");
      return res.json({
        success: true,
        message: "Logout successful",
      });
    });
  });
};

exports.getCurrentUser = (req, res) => {
  if (req.isAuthenticated()) {
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

    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Account deleted but logout failed",
        });
      }

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Account deleted but session destruction failed",
          });
        }

        res.json({
          success: true,
          message: "Account deleted successfully",
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting account",
      error: error.message,
    });
  }
};
