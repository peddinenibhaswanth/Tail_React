const cors = require("cors");
const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const indexRoutes = require("./routes/indexRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.set("trust proxy", 1);

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
      if (req.headers["x-no-compression"]) {
        return false;
      }
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
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===========================================
// CORS MIDDLEWARE
// ===========================================
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];

const envOrigins = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowlist = new Set([...defaultOrigins, ...envOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowlist.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ===========================================
// BODY PARSING MIDDLEWARE
// ===========================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===========================================
// APPLY RATE LIMITERS TO ROUTES
// ===========================================
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);

// ===========================================
// SWAGGER API DOCUMENTATION
// ===========================================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===========================================
// ROUTES
// ===========================================
app.use("/api/partner", partnerRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", indexRoutes);

// Error handling middleware
// eslint-disable-next-line no-unused-vars
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
