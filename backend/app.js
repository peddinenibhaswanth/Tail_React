const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const passport = require("passport");

// Create Express app
const app = express();

// If running behind a reverse proxy (Render, etc.), enable trust proxy so
// req.ip / req.secure behave correctly. Keep it opt-in to avoid surprises.
if (process.env.TRUST_PROXY) {
  const rawTrustProxy = String(process.env.TRUST_PROXY).trim().toLowerCase();
  const trustProxyValue =
    rawTrustProxy === "true" ? true : Number(rawTrustProxy) || 1;
  app.set("trust proxy", trustProxyValue);
}

// ===========================================
// SECURITY MIDDLEWARE - Helmet
// ===========================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// ===========================================
// COMPRESSION MIDDLEWARE
// ===========================================
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  })
);

// ===========================================
// RATE LIMITING MIDDLEWARE
// ===========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===========================================
// CORS MIDDLEWARE
// ===========================================
const defaultCorsOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];

const envCorsOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const allowVercelPreviewOrigins =
  String(process.env.ALLOW_VERCEL_PREVIEW_ORIGINS || "")
    .trim()
    .toLowerCase() === "true";

const vercelPreviewOriginRegex = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i;

const allowedOrigins = Array.from(
  new Set([...defaultCorsOrigins, ...envCorsOrigins])
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (allowVercelPreviewOrigins && vercelPreviewOriginRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ===========================================
// BODY PARSING MIDDLEWARE
// ===========================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===========================================
// PASSPORT (OAuth strategies)
// ===========================================
require("./config/passport")(passport);
app.use(passport.initialize());

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Apply rate limiters
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);

// ===========================================
// SWAGGER API DOCUMENTATION
// ===========================================
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===========================================
// ROUTES
// ===========================================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pets", require("./routes/petRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/revenue", require("./routes/revenueRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/partner", require("./routes/partnerRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api", require("./routes/indexRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;
