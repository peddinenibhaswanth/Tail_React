const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { ensureAuthenticated, ensureGuest } = require("../middleware/auth");
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
} = require("../middleware/validators");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/users/");
  },
  filename: function (req, file, cb) {
    cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// Auth routes with validation
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/logout", ensureAuthenticated, authController.logout);

// getCurrentUser needs ensureAuthenticated to verify JWT and set req.user
router.get("/current", ensureAuthenticated, authController.getCurrentUser);

router.get("/profile", ensureAuthenticated, authController.getProfile);
router.put(
  "/profile",
  ensureAuthenticated,
  upload.single("profileImage"),
  validateProfileUpdate,
  authController.updateProfile
);
router.put(
  "/change-password",
  ensureAuthenticated,
  validatePasswordChange,
  authController.changePassword
);
router.delete("/account", ensureAuthenticated, authController.deleteAccount);

module.exports = router;
