const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Import configurations
const connectDB = require("./config/db");
const app = require("./app");

// Fail fast on missing secrets in production
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in production environment");
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
