const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { ensureAuthenticated, ensureGuest } = require("../middleware/auth");
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

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", ensureAuthenticated, authController.logout);

router.get("/current", authController.getCurrentUser);

router.get("/profile", ensureAuthenticated, authController.getProfile);
router.put(
  "/profile",
  ensureAuthenticated,
  upload.single("profileImage"),
  authController.updateProfile
);
router.put(
  "/change-password",
  ensureAuthenticated,
  authController.changePassword
);
router.delete("/account", ensureAuthenticated, authController.deleteAccount);

module.exports = router;
