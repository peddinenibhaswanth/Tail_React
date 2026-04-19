const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ensureAuthenticated, ensureGuest } = require("../middleware/auth");
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
} = require("../middleware/validators");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadRequestFilesToCloudinary } = require("../middleware/cloudinaryUpload");

const isGoogleOauthConfigured = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-in-production";

const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const parseCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1));
  }
  return null;
};

const isHttpsRequest = (req) => {
  if (req.secure) return true;
  const xfProto = req.headers["x-forwarded-proto"];
  if (typeof xfProto === "string") {
    return xfProto.split(",")[0].trim().toLowerCase() === "https";
  }
  return false;
};

const parseEnvBool = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const v = String(value).trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return undefined;
};

const getPrimaryClientUrl = () => {
  const raw = process.env.CLIENT_URL || "http://localhost:3000";
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)[0] || "http://localhost:3000";
};

const respondOAuthNotConfigured = (req, res) => {
  const msg =
    "Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";

  if (req.accepts("html")) {
    const redirectUrl = new URL("/login", getPrimaryClientUrl());
    redirectUrl.searchParams.set("oauth", "failed");
    redirectUrl.searchParams.set("message", msg);
    return res.redirect(redirectUrl.toString());
  }

  return res.status(501).json({ success: false, message: msg });
};

const setOauthStateCookie = (req, res, state) => {
  const secureOverride = parseEnvBool(process.env.OAUTH_COOKIE_SECURE);
  const secure = secureOverride !== undefined ? secureOverride : isHttpsRequest(req);
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: OAUTH_STATE_TTL_MS,
    path: "/api/auth",
  });
};

const clearOauthStateCookie = (res) => {
  res.clearCookie(OAUTH_STATE_COOKIE, {
    path: "/api/auth",
  });
};

const generateOauthState = () => {
  const nonce = crypto.randomBytes(16).toString("hex");
  return jwt.sign({ nonce }, JWT_SECRET, { expiresIn: "10m" });
};

const verifyOauthState = (state) => {
  jwt.verify(state, JWT_SECRET);
  return true;
};

// Ensure local upload directory exists (used as a temporary staging area when Cloudinary is enabled)
fs.mkdirSync(path.join(__dirname, "../uploads/users"), { recursive: true });

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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and profile management
 */

// Auth routes with validation

// Google OAuth
router.get("/google", (req, res, next) => {
  if (!isGoogleOauthConfigured()) {
    return respondOAuthNotConfigured(req, res);
  }

  const state = generateOauthState();
  setOauthStateCookie(req, res, state);

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
    state,
  })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!isGoogleOauthConfigured()) {
    return respondOAuthNotConfigured(req, res);
  }

  const returnedState = req.query?.state;
  const cookieState = parseCookie(req.headers.cookie, OAUTH_STATE_COOKIE);

  try {
    if (!returnedState || !cookieState || returnedState !== cookieState) {
      throw new Error("Invalid OAuth state");
    }
    verifyOauthState(returnedState);
  } catch (e) {
    clearOauthStateCookie(res);
    const redirectUrl = new URL("/login", getPrimaryClientUrl());
    redirectUrl.searchParams.set("oauth", "failed");
    redirectUrl.searchParams.set(
      "message",
      "Google authentication failed. Please try again."
    );
    return res.redirect(redirectUrl.toString());
  }

  return passport.authenticate(
    "google",
    { session: false },
    (err, user, info) => {
      clearOauthStateCookie(res);
      if (err || !user) {
        const redirectUrl = new URL("/login", getPrimaryClientUrl());
        redirectUrl.searchParams.set("oauth", "failed");
        redirectUrl.searchParams.set(
          "message",
          info?.message || "Google authentication failed. Please try again."
        );
        return res.redirect(redirectUrl.toString());
      }

      req.user = user;
      return authController.oauthSuccessRedirect(req, res);
    }
  )(req, res, next);
});
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - password2
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               password2:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [customer, seller, veterinary, organization]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post("/register", validateRegister, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful, returns token and user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validateLogin, authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", ensureAuthenticated, authController.logout);

// getCurrentUser needs ensureAuthenticated to verify JWT and set req.user
/**
 * @swagger
 * /api/auth/current:
 *   get:
 *     summary: Get the currently authenticated user's data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get("/current", ensureAuthenticated, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile data
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.get("/profile", ensureAuthenticated, authController.getProfile);
router.put(
  "/profile",
  ensureAuthenticated,
  upload.single("profileImage"),
  uploadRequestFilesToCloudinary({ folder: "users" }),
  validateProfileUpdate,
  authController.updateProfile
);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change the current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Incorrect current password
 */
router.put(
  "/change-password",
  ensureAuthenticated,
  validatePasswordChange,
  authController.changePassword
);

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete the current user's account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       500:
 *         description: Server error
 */
router.delete("/account", ensureAuthenticated, authController.deleteAccount);

module.exports = router;
